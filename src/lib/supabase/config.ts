export const SUPABASE_URL =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '';

export const SUPABASE_ANON_KEY =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' : '';

export const SUPABASE_SERVICE_ROLE_KEY =
  typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY || '' : '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const isSupabaseServerConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY,
);