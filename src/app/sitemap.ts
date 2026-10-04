import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  return ['', '/masterclass', '/programme', '/academy', '/inscription'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}