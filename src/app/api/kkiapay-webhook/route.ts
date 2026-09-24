import { NextRequest, NextResponse } from 'next/server';
import { FORMATIONS_MAP } from '@/lib/formations';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Route appelée automatiquement par Kkiapay après chaque transaction.
// URL à configurer dans Kkiapay > Développeurs > Webhook.
//
// Variables d'environnement à définir :
//   KKIAPAY_WEBHOOK_SECRET  -> le "secret hash" choisi en configurant le webhook Kkiapay
//   BREVO_API_KEY           -> la clé API Brevo (SMTP & API > API Keys)
//   SENDER_EMAIL            -> l'adresse expéditeur validée dans Brevo
//   SITE_URL                -> l'adresse du site en production
//   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
//                           -> pour l'idempotence durable (table payments)

// Anti-rejeu rapide en mémoire (fallback si Supabase non configuré).
const processedInMemory = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // 1. Vérifier que la requête vient bien de Kkiapay (secret partagé)
    const receivedSecret = req.headers.get('x-kkiapay-secret');
    if (!process.env.KKIAPAY_WEBHOOK_SECRET) {
      console.error('KKIAPAY_WEBHOOK_SECRET non configuré.');
      return NextResponse.json({ error: 'Serveur mal configuré' }, { status: 500 });
    }
    if (receivedSecret !== process.env.KKIAPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const body = await req.json();

    // 2. Ignorer les transactions échouées
    if (!body.isPaymentSucces) {
      return NextResponse.json({ message: 'Transaction non réussie, ignorée.' });
    }

    // 3. Idempotence rapide en mémoire
    if (body.transactionId && processedInMemory.has(body.transactionId)) {
      return NextResponse.json({ message: 'Déjà traité' });
    }

    // 4. Récupérer nos métadonnées (formation + email) transmises via "data"
    let meta: { formation?: string; email?: string } = {};
    const raw = typeof body.stateData === 'string' ? body.stateData : body.stateData || body.data;
    try {
      meta = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    } catch {
      meta = {};
    }

    const formationName = meta.formation;
    const clientEmail = meta.email;
    const formation = formationName ? FORMATIONS_MAP[formationName] : undefined;

    if (!formation || !clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      console.error('Métadonnées invalides sur la transaction', body.transactionId, meta);
      return NextResponse.json({ message: 'Métadonnées manquantes, envoi automatique impossible.' });
    }

    // 5. Vérification anti-fraude : le montant payé doit couvrir le prix réel
    if (Number(body.amount) < formation.price) {
      console.error('Montant insuffisant pour', formationName, '-', body.amount, 'reçu,', formation.price, 'attendu');
      return NextResponse.json({ message: 'Montant insuffisant, envoi bloqué.' });
    }

    // 6. Suivi durable du paiement (idempotence après redémarrage)
    const serviceRole = await getServiceRoleClient();
    if (serviceRole && body.transactionId) {
      const { data: existing } = await serviceRole
        .from('payments')
        .select('id, status')
        .eq('transaction_id', body.transactionId)
        .maybeSingle();

      if (existing && existing.status === 'succes') {
        console.log('Paiement déjà traité (base)', body.transactionId);
        return NextResponse.json({ message: 'Déjà traité' });
      }

      if (!existing) {
        const { error: insErr } = await serviceRole.from('payments').insert({
          transaction_id: body.transactionId,
          formation: formationName,
          email: clientEmail,
          amount: Number(body.amount),
          status: 'pending',
        });
        if (insErr) {
          if (insErr.code !== '23505') {
            console.error('Erreur enregistrement paiement:', insErr.message);
          }
          // 23505 : inséré entre-temps par un retry concurrent -> on continue (envoi).
        }
      }
    }

    // 7. Envoyer le PDF par email via Brevo (en pièce jointe, lien en secours)
    if (!process.env.SITE_URL || !process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
      console.error('Configuration incomplète (SITE_URL, BREVO_API_KEY, SENDER_EMAIL).');
      return NextResponse.json({ error: 'Serveur mal configuré' }, { status: 500 });
    }
    const pdfUrl = `${process.env.SITE_URL}/pdf/${formation.file}`;

    let attachment: { name: string; content: string } | undefined;
    try {
      const pdfResp = await fetch(pdfUrl);
      if (pdfResp.ok) {
        const buf = await pdfResp.arrayBuffer();
        attachment = {
          name: formation.file,
          content: Buffer.from(buf).toString('base64'),
        };
      }
    } catch (err) {
      console.error('Impossible de récupérer le PDF:', err);
    }

    const htmlContent = attachment
      ? `<p>Bonjour,</p><p>Merci pour votre achat de la formation <strong>${formationName}</strong> sur Novenetech Academy.</p><p>Votre support de formation est ci-joint (${formation.file}).</p><p>Si la pièce jointe n'apparaît pas, téléchargez-le : <a href="${pdfUrl}">${pdfUrl}</a></p><p>Bon apprentissage,<br>L'équipe Novenetech</p>`
      : `<p>Bonjour,</p><p>Merci pour votre achat de la formation <strong>${formationName}</strong> sur Novenetech Academy.</p><p>Vous pouvez télécharger votre support de formation complet ici : <a href="${pdfUrl}">${pdfUrl}</a></p><p>Bon apprentissage,<br>L'équipe Novenetech</p>`;

    const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Novenetech Academy', email: process.env.SENDER_EMAIL },
        to: [{ email: clientEmail }],
        subject: `Votre formation "${formationName}" — Novenetech Academy`,
        htmlContent,
        ...(attachment ? { attachment: [attachment] } : {}),
      }),
    });

    if (!emailResp.ok) {
      const errText = await emailResp.text();
      console.error('Erreur envoi email Brevo:', errText);
      // L'envoi a échoué : on marque le paiement pour qu'un retry Kkiapay retente l'email.
      if (serviceRole && body.transactionId) {
        await serviceRole.from('payments').update({ status: 'email_echo' }).eq('transaction_id', body.transactionId);
      }
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
    }

    // 8. Marquer le paiement comme livré
    if (serviceRole && body.transactionId) {
      await serviceRole.from('payments').update({ status: 'succes' }).eq('transaction_id', body.transactionId);
    }
    if (body.transactionId) {
      processedInMemory.add(body.transactionId);
    }

    return NextResponse.json({ message: 'PDF envoyé avec succès à ' + clientEmail });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}