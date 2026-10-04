'use client';
import Brand from '@/components/Brand';
import { useActionState, useEffect, useState } from 'react';
import { updatePasswordAction, type AuthState } from '@/app/auth/actions';
import ThemeToggle from '@/components/ThemeToggle';
import { getBrowserClient } from '@/lib/supabase/client';

export default function ResetPassword() {
  const [valid, setValid] = useState<boolean | null>(() => (getBrowserClient() ? null : true));
  const [state, formAction, pending] = useActionState<AuthState, FormData>(updatePasswordAction, { error: null });

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setValid(Boolean(data.session));
    }).catch(() => {
      if (!cancelled) setValid(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="wrap auth-shell">
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section auth-section">
        <Brand />
        <div className="card auth-panel">
          <h1>Nouveau mot de passe</h1>
          {state.success ? (
            <div className="auth-banner auth-banner--success" role="status">
              <p>Ton nouveau mot de passe est enregistré.</p>
              <a className="text-link" href="/login">Se connecter avec le nouveau mot de passe</a>
            </div>
          ) : valid === null ? (
            <p className="muted">Vérification de la session…</p>
          ) : valid ? (
            <>
              <p className="muted">Choisis un nouveau mot de passe d&apos;au moins 6 caractères.</p>
              <form action={formAction} className="auth-form">
                <label htmlFor="new-password">Mot de passe</label>
                <input id="new-password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" />
                {state.error && (
                  <div className="auth-inline-error">
                    <p className="auth-banner auth-banner--error" role="alert">{state.error}</p>
                    <a className="text-link" href="/forgot-password">Demander un nouveau lien</a>
                  </div>
                )}
                <button type="submit" className="btn" disabled={pending}>
                  {pending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="auth-banner auth-banner--error" role="alert">Ce lien est invalide ou expiré.</p>
              <div className="auth-links">
                <a href="/forgot-password" className="muted">Demander un nouveau lien</a>
                <a href="/login" className="muted">Se connecter</a>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
