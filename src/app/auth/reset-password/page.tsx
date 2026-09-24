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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="wrap" style={{ maxWidth: 520 }}>
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section" style={{ paddingTop: 30 }}>
        <Brand />
        <div className="card">
          <h1>Nouveau mot de passe</h1>
          {valid === null ? (
            <p className="muted">Vérification de la session…</p>
          ) : valid ? (
            <>
              <p className="muted">Choisis un nouveau mot de passe d&apos;au moins 6 caractères.</p>
              <form action={formAction}>
                <label htmlFor="new-password">Mot de passe</label>
                <input id="new-password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" />
                {state.error && (
                  <p className="accent" role="alert" style={{ fontWeight: 600 }}>{state.error}</p>
                )}
                <button type="submit" className="btn" disabled={pending} style={{ opacity: pending ? 0.6 : 1 }}>
                  {pending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600 }}>Ce lien est invalide ou expiré.</p>
              <div className="authLinks" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <a href="/forgot-password" className="muted" style={{ fontSize: 14 }}>Demander un nouveau lien</a>
                <a href="/login" className="muted" style={{ fontSize: 14 }}>Se connecter</a>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}