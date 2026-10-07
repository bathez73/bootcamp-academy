import type { Metadata } from 'next';
import MasterclassLanding from '@/components/MasterclassLanding';
import { MARKETING_CONFIG } from '@/lib/marketing-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Masterclass gratuite — De 0 à ton premier client digital | Bootcamp Academy',
  description: 'Le 24 octobre à 20 h, heure du Bénin. Découvre comment transformer une compétence digitale en offre et commencer à trouver tes premiers prospects.',
  alternates: { canonical: '/masterclass' },
  openGraph: {
    type: 'website',
    locale: 'fr_BJ',
    siteName: 'Bootcamp Academy by Novenetech',
    title: 'Masterclass gratuite — De 0 à ton premier client digital | Bootcamp Academy',
    description: 'Le 24 octobre à 20 h, heure du Bénin. Découvre comment transformer une compétence digitale en offre et commencer à trouver tes premiers prospects.',
    url: '/masterclass',
    images: MARKETING_CONFIG.OPEN_GRAPH_IMAGE ? [{ url: MARKETING_CONFIG.OPEN_GRAPH_IMAGE, alt: 'Bootcamp Academy by Novenetech' }] : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Masterclass gratuite — De 0 à ton premier client digital | Bootcamp Academy',
    description: 'Le 24 octobre à 20 h, heure du Bénin. Réserve gratuitement ta place.',
    images: MARKETING_CONFIG.OPEN_GRAPH_IMAGE ? [MARKETING_CONFIG.OPEN_GRAPH_IMAGE] : undefined,
  },
};

export default function MasterclassPage() {
  return <MasterclassLanding />;
}