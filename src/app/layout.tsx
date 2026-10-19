import './globals.css';
import './masterclass.css';
import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import { THEME_SWITCH_SCRIPT } from '@/lib/theme';
import { Suspense } from 'react';
import { CookieConsent, CookieSettingsLink } from '@/components/CookieConsent';
import MetaPageTracker from '@/components/MetaPageTracker';
import InternalPageTracker from '@/components/InternalPageTracker';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sora.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#f5f7fb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#07111f" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: `${THEME_SWITCH_SCRIPT};document.documentElement.classList.add('js');` }} />
      </head>
      <body>
        <CookieConsent />
        <InternalPageTracker />
        <Suspense fallback={null}><MetaPageTracker /></Suspense>
        {children}
        <CookieSettingsLink />
        <aside className="data-protection-notice" aria-label="Protection des données personnelles">
          Vos données personnelles sont traitées par Novenetech selon les finalités présentées lors de leur collecte. Pour exercer vos droits ou saisir l&apos;Autorité de protection des données personnelles (APDP) du Bénin, contactez{' '}
          <a href="mailto:novenetech@gmail.com">novenetech@gmail.com</a>.
        </aside>
      </body>
    </html>
  );
}
