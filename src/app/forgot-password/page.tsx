'use client';
import Brand from '@/components/Brand';
import { useActionState } from 'react';
import { resetPasswordAction, type AuthState } from '@/app/auth/actions';
import ThemeToggle from '@/components/ThemeToggle';

export default function ForgotPassword() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(resetPasswordAction, { error: null });

  return (
    <div className="wrap" style={{ maxWidth: 520 }}>
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section" style={{ paddingTop: 30 }}>
        <Brand />
        <div className="card">
          <h1>Mot de passe oublié</h1>
          {state.success ? (
            <p style={{ fontWeight: 600 }}>
              Si cet email existe, un lien de réinitialisation vient d&apos;être envoyé. Vérifie ta boîte de réception.
            </p>
          ) : (
            <>
              <p className="muted">Indique ton email, on t&apos;envoie un lien pour choisir un nouveau mot de passe.</p>
              <form action={formAction}>
                <label htmlFor="reset-email">Email</label>
                <input id="reset-email" name="email" type="email" required autoComplete="email" placeholder="toi@exemple.com" />
                {state.error && (
                  <p className="accent" role="alert" style={{ fontWeight: 600 }}>{state.error}</p>
                )}
                <button type="submit" className="btn" disabled={pending} style={{ opacity: pending ? 0.6 : 1 }}>
                  {pending ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
          <div className="authLinks" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="/login" className="muted" style={{ fontSize: 14 }}>Retour à la connexion</a>
          </div>
        </div>
      </section>
    </div>
  );
}