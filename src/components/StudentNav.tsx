import Link from 'next/link';

export default function StudentNav() {
	return (
		<nav className="student-nav" aria-label="Navigation étudiant">
			<Link href="/">Accueil</Link>
			<Link href="/dashboard">Mon challenge</Link>
			<Link href="/programme">Cours</Link>
			<Link href="/crm">Mes prospects</Link>
			<Link href="/ressources">Ressources</Link>
			<Link href="/academy">Academy</Link>
		</nav>
	);
}