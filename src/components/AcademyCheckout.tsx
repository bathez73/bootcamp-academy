'use client';
import Script from 'next/script';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentNav from '@/components/StudentNav';
import Nav from '@/components/Nav';
import { FORMATIONS } from '@/lib/formations';

declare global {
  interface Window {
    openKkiapayWidget?: (opts: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (r: { transactionId: string }) => void) => void;
    addFailedListener?: (cb: (e: unknown) => void) => void;
  }
}

// Clé PUBLIQUE Kkiapay uniquement — jamais la clé privée ni le secret ici.
// À définir dans les variables d'environnement :
//   NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY  (clé live quand le projet passe en production)
//   NEXT_PUBLIC_KKIAPAY_SANDBOX     ('true' par défaut ; mettre 'false' en live)
const KKIAPAY_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '';
const SANDBOX_MODE = process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== 'false';

export default function AcademyCheckout({ email, userId, purchased, checkoutReady }: { email: string; userId: string; purchased: string[]; checkoutReady: boolean }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function payer(montant: number, nomFormation: string) {
    if (!checkoutReady || !KKIAPAY_PUBLIC_KEY) { setMessage('Le paiement est temporairement indisponible.'); return; }
    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValide) {
      setMessage('Connecte-toi avec ton compte pour acheter une formation.');
      return;
    }
    if (typeof window === 'undefined' || !window.openKkiapayWidget) {
      setMessage('Le module de paiement se charge encore, réessaie dans quelques secondes.');
      return;
    }
    window.openKkiapayWidget({
      amount: montant,
      key: KKIAPAY_PUBLIC_KEY,
      sandbox: SANDBOX_MODE,
      email,
      data: JSON.stringify({ formation: nomFormation, email, userId }),
      theme: '#53e3a6',
    });
  }

  return (
    <div className="wrap">
      <Nav />
      {userId && <StudentNav />}
      <Script
        src="https://cdn.kkiapay.me/k.js"
        strategy="afterInteractive"
        onError={() => setMessage("Le module de paiement est indisponible. Recharge la page pour réessayer.")}
        onReady={() => {
          setReady(true);
          window.addSuccessListener?.(() => {
            setMessage('Paiement signalé par le prestataire. Après vérification, ton document sera envoyé par email et accessible depuis cette page.');

          });
          window.addFailedListener?.(() => {
            setMessage("Le paiement n’a pas abouti. Tu peux réessayer.");
          });
        }}
      />

      <section className="section">
        <p className="accent"><b>NOVENETECH ACADEMY</b></p>
        <h1>Des compétences digitales appliquées à des résultats business</h1>
        <p className="muted">
          Trois formations complémentaires, vendues séparément du Challenge 28 jours. Connecte-toi pour acheter et retrouver tes supports.
        </p>

        <div className="card" style={{ maxWidth: 420, marginTop: 20, marginBottom: 30 }}>
          <label style={{ marginTop: 0 }} htmlFor="akademy-email">Ton email (pour recevoir la formation)</label>
          <input
            id="akademy-email"
            type="email"
            placeholder="toi@exemple.com"
            value={email}
            readOnly
            required
          />
        </div>

        {userId && <p><button className="btn btn2" onClick={() => router.refresh()}>Actualiser mes achats</button></p>}
        <div className="grid">
          {FORMATIONS.map((f) => (
            <div className="card" key={f.nom}>
              <h3>{f.nom}</h3>
              <p className="muted">{f.promesse}</p>
              <div className="price" style={{ fontSize: 28, margin: '14px 0' }}>
                {f.prix.toLocaleString('fr-FR')} <small>FCFA</small>
              </div>
              <button
                type="button"
                className="btn"
                disabled={!ready || !KKIAPAY_PUBLIC_KEY || !userId || !checkoutReady || purchased.includes(f.nom)}
                onClick={() => payer(f.prix, f.nom)}
              >
                {purchased.includes(f.nom) ? "Formation achetée" : "Payer maintenant"}
              </button>
              {purchased.includes(f.nom) ? <p><a className="text-link" href={`/pdf/${f.file}`}>Télécharger mon achat</a></p> : !userId ? <p><a className="text-link" href="/login?redirect=/academy">Se connecter pour acheter</a></p> : null}
            </div>
          ))}
        </div>

        <p className="muted" style={{ marginTop: 30, fontSize: 13 }}>
          Paiement sécurisé par Kkiapay (Mobile Money MTN / Moov / Celtiis, carte Visa/Mastercard).
          <br />
          {(!KKIAPAY_PUBLIC_KEY || userId && !checkoutReady) && <span>Le paiement est temporairement indisponible. </span>}
          {SANDBOX_MODE
            ? '⚠️ Page actuellement en mode SANDBOX (test) — aucun vrai paiement n\'est débité.'
            : 'Mode LIVE activé — paiements réels en cours.'}
        </p>
      </section>

      {message && (
        <div role="status" aria-live="polite"
          style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--fg)',
            padding: '14px 22px', borderRadius: 10, maxWidth: '90%', textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}