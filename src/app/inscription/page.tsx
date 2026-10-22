import Link from 'next/link';
import Nav from '@/components/Nav';
import { BOOTCAMP_SALES_CONFIG as offer } from '@/lib/bootcamp-sales-config';

const whatsapp = 'https://wa.me/22952527913';

export const metadata = {
	title: 'Rejoindre l’accompagnement | Novenetech',
	description: `Accompagnement complet à 25 000 FCFA, paiement intégral sur Chariow. Début le ${offer.startDateLabel}.`,
};

export default async function Inscription({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
	const { access } = await searchParams;

	return (
		<div className="wrap">
			<Nav />
			<main className="section">
				{access === 'pending' && (
					<p className="auth-banner" role="status">
						Ton accès aux cours n’est pas encore validé. Il est ouvert par l’équipe après vérification de ton paiement. Une question sur ton règlement ? <a className="text-link" href={whatsapp} target="_blank" rel="noopener noreferrer">Contacte l’équipe sur WhatsApp</a>.
					</p>
				)}

				<h1>Rejoindre l’accompagnement</h1>
				<p>
					L’accompagnement complet du Challenge 28 jours coûte 25 000 FCFA, en paiement intégral sur Chariow.
					Il commence le {offer.startDateLabel}.
				</p>
				<p>
					<a className="btn" href={offer.fullPaymentUrl}>{offer.purchaseLabel}</a>
				</p>
				<p className="muted">
					Après ton paiement, <Link className="text-link" href="/signup">crée ton compte</Link> avec le même email que sur Chariow. L’équipe vérifie ton paiement puis ouvre ton accès à l’espace étudiant.
				</p>

				<section className="section card">
					<h2>Masterclass gratuite — une inscription distincte</h2>
					<p>Rendez-vous le {offer.masterclassDateLabel}. La participation est gratuite et ne donne pas accès à l’accompagnement.</p>
					<Link className="btn btn2" href="/masterclass#inscription">Je réserve ma place gratuitement</Link>
				</section>
			</main>
		</div>
	);
}
