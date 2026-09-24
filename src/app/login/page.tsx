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
    <div className="wrap" style={{ maxWidth: 520 }}>
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section" style={{ paddingTop: 30 }}>
        <Brand />
        <div className="card">
          <h1>Connexion étudiant</h1>
          <p className="muted">Accède à ton Challenge 28 jours.</p>
          <form action={formAction}>
            <input type="hidden" name="redirect" value={redirectTo} />
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="toi@exemple.com" />
            <label htmlFor="login-password">Mot de passe</label>
            <input id="login-password" name="password" type="password" required minLength={6} autoComplete="current-password" placeholder="••••••••" />
            {state.error && (
              <p className="accent" role="alert" style={{ fontWeight: 600 }}>{state.error}</p>
            )}
            <button type="submit" className="btn" disabled={pending} style={{ opacity: pending ? 0.6 : 1 }}>
              {pending ? 'Connexion…' : 'Se connecter'}
            </button>
</form>
          <div className="authLinks" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="/signup" className="muted" style={{ fontSize: 14 }}>Pas encore de compte ? Créer un compte gratuit</a>
            <a href="/forgot-password" className="muted" style={{ fontSize: 14 }}>Mot de passe oublié ?</a>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            MVP : Supabase Auth prend le relais dès que les variables d&apos;environnement sont définies.
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
