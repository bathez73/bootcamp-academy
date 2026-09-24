'use client';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div className="page-tools"><ThemeToggle /></div>
      <section className="section" style={{ marginTop: 80 }}>
        <p className="accent eyebrow"><b>ERREUR</b></p>
        <h1>Oups, quelque chose s&apos;est mal passé.</h1>
        <p className="muted">
          Une erreur inattendue est survenue. Tu peux réessayer ou revenir à l&apos;accueil.
          {error.digest ? <span> (référence&nbsp;: <code>{error.digest}</code>)</span> : null}
        </p>
        <div className="home-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button className="btn" type="button" onClick={reset}>Réessayer</button>
          <Link className="btn btn2" href="/">Retour à l&apos;accueil</Link>
        </div>
      </section>
    </div>
  );
}