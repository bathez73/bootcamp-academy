'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COHORT_FULL_PRICE, COHORT_REGISTRATION_FEE, getCohortPaymentState } from '@/lib/cohort-access';

declare global {
  interface Window {
    openKkiapayWidget?: (opts: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (r: { transactionId: string }) => void) => void;
    addFailedListener?: (cb: (e: unknown) => void) => void;
  }
}

const KKIAPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '';
const SANDBOX_MODE = process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== 'false';

type CohortCheckoutProps = {
  email: string;
  userId: string;
  payments: Array<{ amount: number | string; verified?: boolean | null }>;
  approved: boolean;
  checkoutReady: boolean;
};

export default function CohortCheckout({ email, userId, payments, approved, checkoutReady }: CohortCheckoutProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const paidBeforeTransaction = useRef(0);
  const state = useMemo(() => getCohortPaymentState(payments, approved), [payments, approved]);

  useEffect(() => {
    if (!awaitingWebhook) return;

    if (state.totalPaid > paidBeforeTransaction.current) {
      setAwaitingWebhook(false);
      setPaymentInProgress(false);
      if (state.hasAccess) {
        setMessage('Paiement et autorisation confirmés. Redirection vers ton espace…');
        const timer = window.setTimeout(() => router.replace('/dashboard'), 1400);
        return () => window.clearTimeout(timer);
      }
      setMessage(state.settled
        ? 'Solde confirmé. Ta demande a été envoyée à l’équipe pour autorisation. Un email te sera adressé dès validation.'
        : 'Paiement confirmé. Le solde restant est maintenant actualisé.');
      return;
    }

    const interval = window.setInterval(() => router.refresh(), 3000);
    const timeout = window.setTimeout(() => {
      setAwaitingWebhook(false);
      setPaymentInProgress(false);
      setMessage('Le paiement a été signalé par Kkiapay. La confirmation prend plus de temps que prévu. Réactualise cette page dans un instant.');
    }, 60000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [awaitingWebhook, state.totalPaid, state.hasAccess, state.settled, router]);

  function pay(type: 'registration' | 'balance', amount: number) {
    if (!checkoutReady || !KKIAPAY_PUBLIC_KEY) {
      setMessage('Le paiement est temporairement indisponible.');
      return;
    }

    if (!userId) {
      setMessage('Connecte-toi avant de payer l’inscription.');
      return;
    }

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValide) {
      setMessage('Ton email est invalide. Vérifie ton compte avant de payer.');
      return;
    }

    if (typeof window === 'undefined' || !window.openKkiapayWidget) {
      setMessage('Le module de paiement se charge encore, réessaie dans quelques secondes.');
      return;
    }

    window.openKkiapayWidget({
      amount,
      key: KKIAPAY_PUBLIC_KEY,
      sandbox: SANDBOX_MODE,
      email,
      data: JSON.stringify({
        paymentType: type === 'registration' ? 'cohort_registration' : 'cohort_balance',
        amount,
        email,
        userId,
        label: type === 'registration' ? 'Frais d’inscription cohorte' : 'Solde cohorte',
      }),
      theme: '#53e3a6',
    });
    setPaymentInProgress(true);
  }

  return (
    <div className="card" style={{ maxWidth: 760, marginTop: 20 }}>
      <p className="accent"><b>PAIEMENT DE LA COHORTE</b></p>
      <h2>Accès au programme 28 jours</h2>
      <p className="muted">
        Total : {COHORT_FULL_PRICE.toLocaleString('fr-FR')} FCFA. <br />
        Frais d’inscription : {COHORT_REGISTRATION_FEE.toLocaleString('fr-FR')} FCFA. <br />
        Reste à régler : {state.remaining.toLocaleString('fr-FR')} FCFA.
      </p>

      <div className="card" style={{ background: 'rgba(83, 227, 166, 0.06)', borderColor: 'rgba(83, 227, 166, 0.25)' }}>
        <p style={{ margin: 0, fontWeight: 700 }}>État :
          {state.hasAccess ? ' Accès autorisé' : state.settled ? ' Paiement complet, validation en attente' : state.registrationPaid ? ' Inscription payée, solde restant à régler' : ' Inscription non payée'}
        </p>
        <p className="muted" style={{ margin: '8px 0 0' }}>
          {state.hasAccess
            ? 'Ton paiement est soldé et l’équipe a autorisé ton accès aux cours et ressources.'
            : state.settled
              ? 'Ton règlement est complet. L’équipe a reçu une demande de validation ; les cours s’ouvriront après son approbation.'
            : state.registrationPaid
              ? 'Tu as déjà versé les 5 000 FCFA d’inscription. Tu peux maintenant régler le solde en 2 fois de 10 000 FCFA.'
              : 'Paye d’abord les frais d’inscription de 5 000 FCFA pour débloquer le parcours complet.'}
        </p>
      </div>

      {!userId && (
        <p style={{ marginTop: 18 }}>
          <a className="btn" href="/login?redirect=/inscription">Se connecter pour payer</a>
        </p>
      )}

      {userId && !state.registrationPaid && (
        <div style={{ marginTop: 22 }}>
          <button type="button" className="btn" disabled={!ready || !KKIAPAY_PUBLIC_KEY || !checkoutReady || paymentInProgress} onClick={() => pay('registration', COHORT_REGISTRATION_FEE)}>
            Payer les frais d’inscription — {COHORT_REGISTRATION_FEE.toLocaleString('fr-FR')} FCFA
          </button>
        </div>
      )}

      {userId && state.registrationPaid && !state.settled && (
        <div style={{ marginTop: 22 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {state.splitInstallments.map((installment, index) => (
              <button
                key={index}
                type="button"
                className="btn btn2"
                disabled={!ready || !KKIAPAY_PUBLIC_KEY || !checkoutReady || paymentInProgress}
                onClick={() => pay('balance', installment)}
              >
                {index === 0 ? '1ère tranche' : '2ème tranche'} — {installment.toLocaleString('fr-FR')} FCFA
              </button>
            ))}
          </div>
        </div>
      )}

      {state.hasAccess && (
        <div style={{ marginTop: 22 }}>
          <a className="btn" href="/dashboard">Accéder à mon espace</a>
        </div>
      )}

      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
        Paiement sécurisé par Kkiapay • Mobile Money / carte • {SANDBOX_MODE ? 'Mode test activé' : 'Mode live activé'}
      </p>

      {message && (
        <div role="status" aria-live="polite" style={{ marginTop: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 12px' }}>
          {message}
        </div>
      )}

      <Script
        src="https://cdn.kkiapay.me/k.js"
        strategy="afterInteractive"
        onError={() => setMessage('Le module de paiement est indisponible. Recharge la page pour réessayer.')}
        onReady={() => {
          setReady(true);
          window.addSuccessListener?.(() => {
            paidBeforeTransaction.current = state.totalPaid;
            setAwaitingWebhook(true);
            setMessage('Paiement signalé par Kkiapay. En attente de confirmation sécurisée…');
            router.refresh();
          });
          window.addFailedListener?.(() => {
            setPaymentInProgress(false);
            setMessage('Le paiement n’a pas abouti. Tu peux réessayer.');
          });
        }}
      />
    </div>
  );
}