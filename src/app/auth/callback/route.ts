import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/redirect';
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const client = await getServerClient();
  const tokenHash = params.get('token_hash');
  const recovery = params.get('type') === 'recovery';
  const next = recovery ? '/auth/reset-password' : safeRedirect(params.get('next') || '/dashboard');

  if (client && tokenHash && recovery) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (client && params.get('code')) {
    const { error } = await client.auth.exchangeCodeForSession(params.get('code')!);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  const failedRecovery = recovery || next === '/auth/reset-password';
  return NextResponse.redirect(new URL(failedRecovery ? '/forgot-password?linkError=1' : '/login?authError=1', request.url));
}
