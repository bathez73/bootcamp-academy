import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// En dev, on tolère eval/source-maps et les websockets. En prod, CSP stricte.
const contentSecurityPolicy = isDev
  ? "default-src 'self' 'unsafe-inline' data: blob: https://*.supabase.co https://*.kkiapay.me ws: wss: http://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.kkiapay.me https://connect.facebook.net https://*.facebook.net; img-src 'self' data: blob: https://*.facebook.com https://*.facebook.net; frame-src 'self' https://*.kkiapay.me https://www.facebook.com https://*.facebook.com; form-action 'self' https://www.facebook.com"
  : "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.kkiapay.me https://connect.facebook.net https://*.facebook.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.facebook.com https://*.facebook.net; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co https://*.kkiapay.me https://api.brevo.com https://connect.facebook.net https://*.facebook.net ws: wss:; " +
    "frame-src 'self' https://*.kkiapay.me https://www.facebook.com https://*.facebook.com; " +
    "object-src 'none'; base-uri 'self'; form-action 'self' https://www.facebook.com; frame-ancestors 'none'";

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { '/pdf/[file]': ['./private/pdf/*.pdf'], '/api/kkiapay-webhook': ['./private/pdf/*.pdf'] },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
