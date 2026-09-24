import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  return ['', '/programme', '/academy', '/login'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}