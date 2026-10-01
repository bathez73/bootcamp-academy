import Link from 'next/link';
import Nav from '@/components/Nav';
import CohortCheckout from '@/components/CohortCheckout';
import { getCohortAccess } from '@/lib/cohort-server';
import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';

export const metadata = { title: 'Inscription à la cohorte | Novenetech', description: 'Rejoins le Challenge 28 jours via un paiement d’inscription de 5 000 FCFA puis le solde en 2 fois.' };

export default async function Inscription() {
	const supabase = await getServerClient();
	const user = supabase ? (await supabase.auth.getUser()).data.user : null;
	const service = await getServiceRoleClient();
	let cohortPayments: Array<{ amount: number | string; verified?: boolean | null }> = [];
	let approved = false;
	let checkoutReady = false;

	if (user && service) {
		const access = await getCohortAccess(user.id);
		cohortPayments = access.payments;
		approved = access.approved;
	}

	checkoutReady = Boolean(user?.email_confirmed_at && process.env.KKIAPAY_WEBHOOK_SECRET && process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY && process.env.SITE_URL && process.env.BREVO_API_KEY && process.env.SENDER_EMAIL && (process.env.COHORT_ADMIN_EMAIL || process.env.SENDER_EMAIL));

	return (
		<div className="wrap">
			<Nav />
			<main className="section">
				<h1>Inscription à la cohorte</h1>
				<p>
					Le parcours se déroule en 3 étapes : créer ton compte, payer les frais d’inscription de 5 000 FCFA, puis finaliser le solde de 20 000 FCFA en 2 fois.
					  Après le paiement total, l’équipe vérifie puis autorise manuellement ton accès aux cours.
				</p>

				<ol className="steps">
					<li>
						<h2>Crée ton compte</h2>
						<p>Confirme ton email pour sécuriser l’accès à ton espace et au paiement.</p>
						<Link className="btn" href="/signup">Créer mon compte</Link>
						<Link className="text-link" href="/login?redirect=/inscription">J’ai déjà un compte</Link>
					</li>
					<li>
						<h2>Paye les frais d’inscription</h2>
						<p>Le premier paiement est fixé à 5 000 FCFA via Kkiapay. Il ouvre ensuite le parcours de paiement du solde.</p>
						<a className="btn" href="https://wa.me/22952527913" target="_blank" rel="noopener noreferrer">Contacter l’équipe</a>
					</li>
					<li>
						<h2>Finalise le solde</h2>
						<p>Tu peux choisir le paiement en 2 tranches de 10 000 FCFA après inscription. Le cours est accessible uniquement après règlement total.</p>
						<Link className="text-link" href="/dashboard">Accéder à mon espace</Link>
					</li>
				</ol>

				<CohortCheckout email={user?.email || ''} userId={user?.id || ''} payments={cohortPayments} approved={approved} checkoutReady={checkoutReady} />
			</main>
		</div>
	);
}
