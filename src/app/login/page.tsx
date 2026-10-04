'use client';
import Brand from '@/components/Brand';
import { Suspense } from 'react';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction, type AuthState } from '@/app/auth/actions';
import ThemeToggle from '@/components/ThemeToggle';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, { error: null });

  return (
    <div className="wrap auth-shell">
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section auth-section">
        <Brand />
        <div className="card auth-panel">
          <h1>Connexion étudiant</h1>
          <p className="muted">Accède à ton Challenge 28 jours.</p>
          {searchParams.has('unavailable') && <p className="auth-banner auth-banner--error" role="alert">La connexion est temporairement indisponible.</p>}
          {searchParams.has('authError') && <p className="auth-banner auth-banner--error" role="alert">Lien invalide ou expiré. Demande un nouveau lien ou connecte-toi.</p>}
          <form action={formAction} className="auth-form">
            <input type="hidden" name="redirect" value={redirectTo} />
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="toi@exemple.com" />
            <label htmlFor="login-password">Mot de passe</label>
            <input id="login-password" name="password" type="password" required minLength={6} autoComplete="current-password" placeholder="••••••••" />
            {state.error && (
              <p className="auth-banner auth-banner--error" role="alert">{state.error}</p>
            )}
            <button type="submit" className="btn" disabled={pending}>
              {pending ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <div className="auth-links">
            <a href="/signup" className="muted">Pas encore de compte ? Créer un compte gratuit</a>
            <a href="/forgot-password" className="muted">Mot de passe oublié ?</a>
          </div>
          <p className="muted auth-footnote">
            Besoin d’aide ? Contacte notre équipe depuis la page d’inscription.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
