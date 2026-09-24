'use client';
import Brand from '@/components/Brand';
import { useActionState } from 'react';
import { signupAction, type AuthState } from '@/app/auth/actions';
import ThemeToggle from '@/components/ThemeToggle';

export default function Signup() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signupAction, { error: null });

  return (
    <div className="wrap" style={{ maxWidth: 520 }}>
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section" style={{ paddingTop: 30 }}>
        <Brand />
        <div className="card">
          <h1>Créer un compte</h1>
          <p className="muted">Rejoins la cohorte Bootcamp-Academy.</p>
          <form action={formAction}>
            <label htmlFor="signup-name">Prénom / Nom</label>
            <input id="signup-name" name="full_name" type="text" autoComplete="name" placeholder="Awa D." />
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="toi@exemple.com" />
            <label htmlFor="signup-password">Mot de passe</label>
            <input id="signup-password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" />
            {state.error && (
              <p className="accent" role="alert" style={{ fontWeight: 600 }}>{state.error}</p>
            )}
            <button type="submit" className="btn" disabled={pending} style={{ opacity: pending ? 0.6 : 1 }}>
              {pending ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
          <div className="authLinks" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="/login" className="muted" style={{ fontSize: 14 }}>Déjà un compte ? Se connecter</a>
          </div>
        </div>
      </section>
    </div>
  );
}