'use server';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type AuthState = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  // Anti open-redirect : on n'accepte qu'un chemin interne, jamais d'URL absolue.
  const rawRedirect = String(formData.get('redirect') || '');
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.includes('://') ? rawRedirect : '/dashboard';

  if (!EMAIL_RE.test(email)) {
    return { error: "Merci d'indiquer un email valide." };
  }
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  if (!isSupabaseConfigured) {
    // Mode démo : Supabase non configuré, on accepte la connexion locale.
    redirect(redirectTo);
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { error: 'Authentification non configurée côté serveur.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Identifiants invalides. Vérifie ton email et ton mot de passe." };
  }

  redirect(redirectTo);
}

export async function logoutAction() {
  const supabase = await getServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect('/login');
}