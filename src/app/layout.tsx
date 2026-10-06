import './globals.css';
import './masterclass.css';
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
  title: 'Bootcamp Academy by Novenetech',
  description: 'De 0 à ton premier client digital',
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Bootcamp Academy by Novenetech',
    title: 'Bootcamp Academy by Novenetech',
    description: 'De 0 à ton premier client digital',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bootcamp Academy by Novenetech',
    description: 'De 0 à ton premier client digital',
  },
};

const META_PIXEL_ID = /^\d+$/.test(process.env.META_PIXEL_ID || '') ? process.env.META_PIXEL_ID : null;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sora.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#f5f7fb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#07111f" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SWITCH_SCRIPT }} />
        {META_PIXEL_ID && <script dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
        }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
