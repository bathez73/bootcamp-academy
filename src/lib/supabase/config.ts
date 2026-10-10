export const SUPABASE_URL =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '';

export const SUPABASE_ANON_KEY =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' : '';

export function getSupabaseServerConfigError() {
  const missingKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((key) => !process.env[key]?.trim());

  if (missingKeys.length === 0) return null;

  return `Les inscriptions sont momentanément indisponibles. Vérifie la configuration Supabase serveur (${missingKeys.join(', ')}).`;
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';