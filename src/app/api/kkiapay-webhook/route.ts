import { NextRequest, NextResponse } from 'next/server';
import { validPayment } from '@/lib/payment-validation';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({error:"Requête invalide"},{status:400});

    // 2. Ignorer les transactions échouées
    if (body.isPaymentSucces !== true) {
      return NextResponse.json({ message: 'Transaction non réussie, ignorée.' });
    }


    // 4. Récupérer nos métadonnées (formation + email) transmises via "data"
    let meta: { formation?: string; email?: string; userId?: string } = {};
    const raw = typeof body.stateData === 'string' ? body.stateData : body.stateData || body.data;
    try {
      meta = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    } catch {
      meta = {};
    }

    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return NextResponse.json({error:"Métadonnées invalides"},{status:400});
    const formationName = meta.formation;
    const clientEmail = typeof meta.email === 'string' ? meta.email.trim().toLowerCase() : '';
    if (typeof meta.userId !== 'string') return NextResponse.json({ error: 'Compte acheteur manquant' }, { status: 400 });
    const formation = typeof formationName === 'string' && Object.hasOwn(FORMATIONS_MAP, formationName) ? FORMATIONS_MAP[formationName] : undefined;

    if (!formation || !clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      console.error('Métadonnées invalides sur la transaction', body.transactionId, meta);
      return NextResponse.json({ message: 'Métadonnées manquantes, envoi automatique impossible.' }, {status:400});
    }

    // 5. Vérification anti-fraude : le montant payé doit couvrir le prix réel
    if (!validPayment(body.transactionId, body.amount, formation.price)) {
      console.error('Montant insuffisant pour', formationName, '-', body.amount, 'reçu,', formation.price, 'attendu');
      return NextResponse.json({ message: 'Montant ou transaction invalide, envoi bloqué.' }, {status:400});
    }

    // Configuration vérifiée avant de prendre en charge une livraison.
    if (!process.env.SITE_URL || !process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) return NextResponse.json({error:'Service indisponible'},{status:503});
    const serviceRole = await getServiceRoleClient();
    if (!serviceRole) return NextResponse.json({error:'Service indisponible'},{status:503});
    const {data: buyer, error: buyerError} = await serviceRole.auth.admin.getUserById(meta.userId);
    if (buyerError || !buyer.user?.email_confirmed_at || buyer.user.email?.toLowerCase() !== clientEmail) return NextResponse.json({error:'Compte acheteur invalide'},{status:400});
    const {error: insertError} = await serviceRole.from('payments').insert({transaction_id:body.transactionId,formation:formationName,email:clientEmail,user_id:buyer.user.id,amount:Number(body.amount),verified:true,status:'pending'});
    if(insertError && insertError.code !== '23505') return NextResponse.json({error:'Enregistrement indisponible'},{status:503});
    const {data: existing, error: readError}=await serviceRole.from('payments').select('status, user_id, formation').eq('transaction_id',body.transactionId).single();
    if(readError) return NextResponse.json({error:'Lecture indisponible'},{status:503});
    if(existing.user_id!==buyer.user.id || existing.formation!==formationName) return NextResponse.json({error:'Transaction incohérente'},{status:409});
    if(existing.status==='succes') return NextResponse.json({message:'Déjà traité'});
    // Une seule requête peut obtenir ce paiement. Un état processing ambigu nécessite une vérification manuelle.
    const {data: claim,error: claimError}=await serviceRole.from('payments').update({status:'processing'}).eq('transaction_id',body.transactionId).in('status',['pending','email_echo']).select('id');
    if(claimError || !claim?.length) return NextResponse.json({error:'Livraison en cours de vérification'},{status:503});

    // 7. Envoyer le PDF par email via Brevo (en pièce jointe, lien en secours)
    if (!process.env.SITE_URL || !process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
      console.error('Configuration incomplète (SITE_URL, BREVO_API_KEY, SENDER_EMAIL).');
      return NextResponse.json({ error: 'Serveur mal configuré' }, { status: 500 });
    }
    const pdfUrl = `${process.env.SITE_URL}/pdf/${formation.file}`;

    // Lecture directe du PDF sur le disque (pas de fetch interne : il serait
    // intercepté par le middleware d'auth et renverrait la page de connexion).
    let attachment: { name: string; content: string } | undefined;
    try {
      const filePath = join(process.cwd(), 'private', 'pdf', formation.file);
      const buffer = await readFile(filePath);
      attachment = {
        name: formation.file,
        content: buffer.toString('base64'),
      };
    } catch (err) {
      console.error('Impossible de lire le PDF sur le disque:', err);
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
      const { error } = await serviceRole.from('payments').update({ status: 'succes' }).eq('transaction_id', body.transactionId);
      if(error) return NextResponse.json({error:'Confirmation de livraison indisponible'},{status:503});
    }

    return NextResponse.json({ message: 'PDF envoyé avec succès à ' + clientEmail });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}