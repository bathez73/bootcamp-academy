import 'server-only';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Clé service role : UNIQUEMENT côté serveur — ce module n'est jamais
// importé dans le bundle client (server-only l'interdit).
export const SUPABASE_SERVICE_ROLE_KEY =
  typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY || '' : '';

export const isSupabaseServerConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY,
);