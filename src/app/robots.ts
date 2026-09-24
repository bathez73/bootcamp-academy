import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/programme', '/academy'],
        disallow: [
          '/login',
          '/signup',
          '/forgot-password',
          '/auth',
          '/dashboard',
          '/crm',
          '/admin',
          '/pdf',
        ],
      },
    ],
  };
}