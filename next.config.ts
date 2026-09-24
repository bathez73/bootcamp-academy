import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// En dev, on tolère eval/source-maps et les websockets. En prod, CSP stricte.
const contentSecurityPolicy = isDev
  ? "default-src 'self' 'unsafe-inline' data: blob: https://*.supabase.co https://*.kkiapay.me ws: wss: http://localhost:*"
  : "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.kkiapay.me; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co https://*.kkiapay.me https://api.brevo.com ws: wss:; " +
    "frame-src 'self' https://*.kkiapay.me; " +
    "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;