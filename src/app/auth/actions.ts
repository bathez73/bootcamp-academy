'use server';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, SITE_URL } from '@/lib/supabase/config';

export type AuthState = { error: string | null; success?: boolean };

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('full_name') || '').trim();

  if (!EMAIL_RE.test(email)) {
    return { error: "Merci d'indiquer un email valide." };
  }
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  if (!isSupabaseConfigured) {
    // Mode démo : pas de base d'utilisateurs, on dirige vers la connexion locale.
    redirect('/login');
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { error: 'Authentification non configurée côté serveur.' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${SITE_URL}/login`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  redirect('/login');
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') || '');
  if (!EMAIL_RE.test(email)) {
    return { error: "Merci d'indiquer un email valide." };
  }

  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { error: 'Authentification non configurée côté serveur.' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/reset-password`,
  });
  if (error) {
    return { error: error.message };
  }

  return { success: true, error: null };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get('password') || '');
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  if (!isSupabaseConfigured) {
    redirect('/login');
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { error: 'Authentification non configurée côté serveur.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect('/login');
}

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