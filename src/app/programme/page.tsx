import Link from 'next/link';
import Nav from '@/components/Nav';
import StudentNav from '@/components/StudentNav';
import { getServerClient } from '@/lib/supabase/server';
import { getCohortAccess } from '@/lib/cohort-server';
import { MISSIONS } from '@/lib/curriculum';

export const metadata = { title: 'Programme du Challenge 28 jours | Novenetech', description: 'Construis ton offre, ton portfolio et ta prospection.' };
const weeks = ['Ton offre et ta cible', 'Tes réalisations et ton portfolio', 'Ta prospection et ton CRM', 'Tes propositions et ton plan d’action'];

export default async function Programme() {
	const supabase = await getServerClient();
	const user = supabase ? (await supabase.auth.getUser()).data.user : null;
	const access = user ? await getCohortAccess(user.id) : null;

	if (!access?.state.hasAccess) {
		return (
			<div className="wrap">
				<Nav />
				<main className="section">
					<p className="accent eyebrow"><b>CHALLENGE 28 JOURS</b></p>
					<h1>Un parcours pratique, semaine après semaine</h1>
					<p>Construis ton offre, ton portfolio, ton système de prospection et tes propositions commerciales.</p>
					<div className="grid programme-grid">
						{weeks.map((title, index) => <section className="card" key={title}><p className="accent">Semaine {index + 1}</p><h2>{title}</h2></section>)}
					</div>
					<section className="section"><p>Le contenu complet est réservé aux participants dont le paiement est soldé et l’accès validé par l’équipe.</p><Link href="/inscription" className="btn">Voir les étapes d’inscription</Link></section>
				</main>
			</div>
		);
	}

	return (
		<div className="wrap">
			<Nav /><StudentNav />
			<main className="section">
				<h1>28 jours pour passer à l’action</h1>
				<p>Une mission et un livrable chaque jour. La signature d’un client dépend de ton offre, du marché et de tes démarches ; elle n’est pas garantie.</p>
				<div className="programme-grid">
					{weeks.map((title, index) => <section className="card" key={title}><p className="accent">Semaine {index + 1}</p><h2>{title}</h2><ol start={index * 7 + 1}>{MISSIONS.slice(index * 7, index * 7 + 7).map((mission) => <li key={mission.day}>{mission.title}</li>)}</ol></section>)}
				</div>
				<section className="section"><h2>Exemple : jour 4</h2><p>{MISSIONS[3].instruction}</p><p><strong>Livrable :</strong> {MISSIONS[3].deliverable}</p></section>
			</main>
		</div>
	);
}