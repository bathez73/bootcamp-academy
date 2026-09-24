import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function NotFound() {
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section" style={{ marginTop: 80 }}>
        <p className="accent eyebrow"><b>404</b></p>
        <h1>Page introuvable.</h1>
        <p className="muted">Cette page n&apos;existe pas ou a été déplacée.</p>
        <div className="home-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link className="btn" href="/">Retour à l&apos;accueil</Link>
          <Link className="btn btn2" href="/programme">Découvrir le programme</Link>
        </div>
      </section>
    </div>
  );
}