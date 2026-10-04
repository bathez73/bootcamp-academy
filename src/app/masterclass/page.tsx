import type { Metadata } from 'next';
import MasterclassLanding from '@/components/MasterclassLanding';
import { getServiceRoleClient } from '@/lib/supabase/server';

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
    images: [{ url: '/Portrait%20d%C3%A9coup%C3%A9%20d%E2%80%99un%20homme%20souriant.png', alt: 'Bathez Bankole, présentateur de la masterclass' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Masterclass gratuite — De 0 à ton premier client digital | Bootcamp Academy',
    description: 'Le 24 octobre à 20 h, heure du Bénin. Réserve gratuitement ta place.',
    images: ['/Portrait%20d%C3%A9coup%C3%A9%20d%E2%80%99un%20homme%20souriant.png'],
  },
};

export default async function MasterclassPage() {
  const service = await getServiceRoleClient();
  const result = service
    ? await service.from('masterclass_registrations').select('id', { count: 'exact', head: true })
    : { count: null, error: new Error('Service indisponible') };

  return <MasterclassLanding initialRegistrationCount={result.error ? null : result.count ?? 0} />;
}