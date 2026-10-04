import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) { return request.nextUrl.pathname === '/academy' ? response : NextResponse.redirect(new URL('/login?unavailable=1', request.url)); }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Une session absente ou invérifiable ne donne jamais accès aux pages privées.
  // La redirection conserve les cookies pour permettre une nouvelle tentative.

  if (!user && request.nextUrl.pathname !== '/academy') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, cohort_access_approved')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileError && profile?.is_admin === true) return response;

    if (['/academy', '/dashboard', '/crm', '/ressources', '/pdf'].some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) {
      if (profileError || profile?.cohort_access_approved !== true) {
        return NextResponse.redirect(new URL('/inscription?access=pending', request.url));
      }
    }
  }

  return response;
}
