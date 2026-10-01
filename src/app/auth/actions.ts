'use server';
import { redirect } from 'next/navigation';
import { safeRedirect } from '@/lib/redirect';
import { getServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, SITE_URL } from '@/lib/supabase/config';

export type AuthState = { error: string | null; success?: boolean };

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('full_name') || '').trim();

  if (!EMAIL_RE.test(email)) {
    return { error: "Merci d'indiquer un email valide." };
  }
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  if (!isSupabaseConfigured) {
    return { error: 'Le service de connexion est temporairement indisponible.' };
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
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/inscription`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  return { error: null, success: true };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Merci d'indiquer un email valide." };
  }

  if (!isSupabaseConfigured) {
    return { error: 'Le service de connexion est temporairement indisponible.' };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { error: 'Authentification non configurée côté serveur.' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/auth/reset-password`,
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
    return { error: 'Le service de connexion est temporairement indisponible.' };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { error: 'Authentification non configurée côté serveur.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') {
      return { error: 'Choisis un mot de passe différent de ton mot de passe actuel.' };
    }
    if (['session_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'bad_jwt', 'reauthentication_needed'].includes(error.code || '') || error.name === 'AuthSessionMissingError') {
      return { error: 'Ta session a expiré. Demande un nouveau lien et ouvre-le dans le même navigateur.' };
    }
    return { error: 'Le mot de passe n’a pas été modifié. Réessaie avec un nouveau lien de réinitialisation.' };
  }

  return { error: null, success: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  // Anti open-redirect : on n'accepte qu'un chemin interne, jamais d'URL absolue.
  const rawRedirect = String(formData.get('redirect') || '');
  const redirectTo = safeRedirect(rawRedirect);

  if (!EMAIL_RE.test(email)) {
    return { error: "Merci d'indiquer un email valide." };
  }
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  if (!isSupabaseConfigured) {
    return { error: 'Le service de connexion est temporairement indisponible.' };
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
