import './globals.css';
import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import { THEME_SWITCH_SCRIPT } from '@/lib/theme';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bootcamp-Academy by Novenetech',
  description: 'De 0 à ton premier client digital',
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Bootcamp-Academy by Novenetech',
    title: 'Bootcamp-Academy by Novenetech',
    description: 'De 0 à ton premier client digital',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bootcamp-Academy by Novenetech',
    description: 'De 0 à ton premier client digital',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sora.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#f5f7fb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#07111f" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SWITCH_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
