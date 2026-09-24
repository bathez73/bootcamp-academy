'use client';
import Script from 'next/script';
import { useState } from 'react';
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
  process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '55a42390b60811f1a98b370682a140ac';
const SANDBOX_MODE = process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== 'false';

export default function Academy() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function payer(montant: number, nomFormation: string) {
    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValide) {
      alert("Merci d'indiquer un email valide avant de payer : c'est à cette adresse que la formation sera envoyée automatiquement.");
      return;
    }
    if (typeof window === 'undefined' || !window.openKkiapayWidget) {
      alert('Le module de paiement se charge encore, réessaie dans quelques secondes.');
      return;
    }
    window.openKkiapayWidget({
      amount: montant,
      key: KKIAPAY_PUBLIC_KEY,
      sandbox: SANDBOX_MODE,
      email,
      data: JSON.stringify({ formation: nomFormation, email }),
      theme: '#53e3a6',
    });
  }

  return (
    <div className="wrap">
      <Nav />
      <Script
        src="https://cdn.kkiapay.me/k.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.addSuccessListener?.(() => {
            setMessage('Paiement reçu ! Votre formation va être envoyée automatiquement à votre email dans quelques instants.');
            setTimeout(() => setMessage(null), 8000);
          });
          window.addFailedListener?.(() => {
            alert("Le paiement n'a pas abouti. Vous pouvez réessayer.");
          });
        }}
      />

      <section className="section">
        <p className="accent"><b>NOVENETECH ACADEMY</b></p>
        <h1>Des compétences digitales appliquées à des résultats business</h1>
        <p className="muted">
          Réservé aux étudiants Campus : 3 formations courtes et pratiques, en plus de ton Challenge 28 jours.
        </p>

        <div className="card" style={{ maxWidth: 420, marginTop: 20, marginBottom: 30 }}>
          <label style={{ marginTop: 0 }} htmlFor="akademy-email">Ton email (pour recevoir la formation)</label>
          <input
            id="akademy-email"
            type="email"
            placeholder="toi@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

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
                onClick={() => payer(f.prix, f.nom)}
              >
                Payer maintenant
              </button>
            </div>
          ))}
        </div>

        <p className="muted" style={{ marginTop: 30, fontSize: 13 }}>
          Paiement sécurisé par Kkiapay (Mobile Money MTN / Moov / Celtiis, carte Visa/Mastercard).
          <br />
          {SANDBOX_MODE
            ? '⚠️ Page actuellement en mode SANDBOX (test) — aucun vrai paiement n\'est débité.'
            : 'Mode LIVE activé — paiements réels en cours.'}
        </p>
      </section>

      {message && (
        <div
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