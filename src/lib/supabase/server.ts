import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config';
import { SUPABASE_SERVICE_ROLE_KEY, isSupabaseServerConfigured } from './server-config';

export async function getServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur — cookies en lecture seule, on ignore.
        }
      },
    },
  });
}

// Client avec la clé service role : serveur uniquement, contourne RLS.
export async function getServiceRoleClient() {
  if (!isSupabaseServerConfigured) return null;
  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}