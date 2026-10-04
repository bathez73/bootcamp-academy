import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// L'Edge middleware reste pris en charge par Next.js 16 et évite le shim
// Node de l'adaptateur Netlify, incompatible avec les chemins Windows.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/academy/:path*',
    '/dashboard/:path*',
    '/crm/:path*',
    '/ressources/:path*',
    '/admin/:path*',
    '/pdf/:path*',
  ],
};
