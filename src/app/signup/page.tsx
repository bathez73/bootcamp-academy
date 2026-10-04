'use client';
import Brand from '@/components/Brand';
import { useActionState } from 'react';
import { signupAction, type AuthState } from '@/app/auth/actions';
import ThemeToggle from '@/components/ThemeToggle';

export default function Signup() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signupAction, { error: null });

  return (
    <div className="wrap auth-shell">
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section auth-section">
        <Brand />
        <div className="card auth-panel">
          <h1>Créer un compte</h1>
          <p className="muted">Crée ton espace personnel. La réservation de la cohorte se confirme séparément avec notre équipe.</p>
          {state.success ? <p className="auth-banner auth-banner--success" role="status">Vérifie tes emails pour confirmer ton adresse, puis <a className="text-link" href="/inscription">poursuis ton inscription</a>.</p> : <form action={formAction} className="auth-form">
            <label htmlFor="signup-name">Prénom / Nom</label>
            <input id="signup-name" name="full_name" type="text" autoComplete="name" placeholder="Awa D." />
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="toi@exemple.com" />
            <label htmlFor="signup-password">Mot de passe</label>
            <input id="signup-password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" />
            {state.error && (
              <p className="auth-banner auth-banner--error" role="alert">{state.error}</p>
            )}
            <button type="submit" className="btn" disabled={pending}>
              {pending ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>}
          <div className="auth-links">
            <a href="/login" className="muted">Déjà un compte ? Se connecter</a>
          </div>
        </div>
      </section>
    </div>
  );
}