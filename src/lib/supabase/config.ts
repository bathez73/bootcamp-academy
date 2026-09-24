export const SUPABASE_URL =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '';

export const SUPABASE_ANON_KEY =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' : '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';