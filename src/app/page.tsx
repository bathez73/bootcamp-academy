import Link from 'next/link';
import Brand from '@/components/Brand';
import Nav from '@/components/Nav';

const whatsapp = 'https://wa.me/22952527913';
const faqs = [
  ['Combien de temps par jour ?', 'Le programme avance jour par jour pendant 28 jours. Prévois un créneau régulier pour suivre les missions et mettre en pratique chaque étape.'],
  ['Je n’ai aucune compétence technique, c’est pour moi ?', 'Tu commences par choisir une compétence, une cible et une offre claire. Les missions guidées t’aident ensuite à construire ton portfolio et à préparer ta prospection.'],
  ['De quoi ai-je besoin ?', 'Une connexion Internet, un ordinateur pour réaliser les exercices et la motivation de pratiquer régulièrement. WhatsApp te permet de rejoindre la communauté.'],
  ['Comment se passe le paiement ?', 'Le tarif de la cohorte est de 25 000 FCFA. Contacte notre équipe sur WhatsApp pour connaître les modalités de paiement et finaliser ton inscription.'],
  ['Et si ça ne marche pas pour moi ?', 'Les résultats dépendent de ton effort et de ta régularité. Même sans première vente, tu repars avec ton offre, ton portfolio, tes scripts de prospection et ton CRM.'],
  ['C’est pour qui, exactement ?', 'Pour les étudiants qui veulent transformer une compétence digitale en service concret, construire un portfolio et apprendre à prospecter leurs premiers clients.'],
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="wrap">
        <Nav />
        <main>
          <section className="hero">
            <div>
              <p className="accent eyebrow"><b>Offre fondateurs — Challenge 28 jours</b></p>
              <h1>Transforme une compétence digitale en <span className="accent">source de revenus.</span></h1>
              <p>Un programme pratique pour étudiants : choisis un service, construis ton portfolio, prospecte de vraies entreprises et apprends à vendre ta première prestation.</p>
              <div className="home-actions">
                <Link className="btn" href="/login">Rejoindre la cohorte — 25 000 FCFA →</Link>
                <Link className="btn btn2" href="/programme">Voir le programme</Link>
              </div>
            </div>
            <div className="card">
              <p className="muted eyebrow">Cohorte fondateurs — places limitées</p>
              <div className="price accent">25 000 <small>FCFA</small></div>
              <p>4 semaines • exercices • templates • communauté • projet final</p>
              <hr />
              <p>✓ Offre monétisable</p><p>✓ Mini-portfolio</p><p>✓ Scripts de prospection</p><p>✓ CRM personnel</p><p>✓ Challenge premier client</p>
              <small className="muted">Encadrement réel pendant 4 semaines</small>
            </div>
          </section>
          <ul className="home-highlights" aria-label="Les points forts du programme">
            <li>✓ 100% pratique</li><li>✓ 28 jours structurés jour par jour</li><li>✓ Encadrement durant 4 semaines</li>
          </ul>
          <section className="section">
            <h2>Tu ne viens pas seulement apprendre. Tu viens construire.</h2>
            <div className="grid">
              <div className="card"><h3>01 — Choisis</h3><p>Une compétence, une cible et une offre claire.</p></div>
              <div className="card"><h3>02 — Construis</h3><p>Portfolio, outils IA et système de livraison.</p></div>
              <div className="card"><h3>03 — Vends</h3><p>Prospection réelle, relances et closing.</p></div>
            </div>
          </section>
          <section className="section">
            <h2>Ce avec quoi tu repars</h2>
            <div className="home-benefits">
              <div className="card">
                <ul className="home-checklist">
                  <li>✓ Accès au challenge 28 jours complet</li>
                  <li>✓ Templates, scripts de prospection et briefs</li>
                  <li>✓ Communauté WhatsApp privée</li>
                  <li>✓ Encadrement pendant 4 semaines</li>
                  <li>✓ Chaque semaine produit un livrable prêt à servir</li>
                </ul>
                <p>Un objectif concret : signer ta première prestation, pas juste « apprendre ».</p>
              </div>
              <div className="card home-emphasis">
                <h3>Une méthode orientée résultats</h3>
                <p>Pas de promesse magique : chaque semaine produit un livrable concret. Jour 7 ton offre, semaine 2 ton portfolio, semaine 3 dix prospects contactés, semaine 4 tes relances et ton premier client.</p>
                <p>Le résultat dépend de ton effort, mais tu repars toujours avec des actifs qui restent les tiens : portfolio, scripts de vente et CRM rempli de vrais contacts.</p>
                <strong className="accent">Même sans première vente, tu ne repars pas les mains vides.</strong>
              </div>
            </div>
          </section>
          <section className="section">
            <h2>Ils l’ont fait. Toi aussi.</h2>
            <div className="grid">
              <figure className="card home-testimonial"><blockquote>“En 3 semaines, j’avais mes premières mises en relation. Je n’aurais jamais osé prospecter avant.”</blockquote><figcaption className="muted">Étudiante en génie logiciel — Bénin</figcaption></figure>
              <figure className="card home-testimonial"><blockquote>“Le cadre des 28 jours m’a poussé à finir mon portfolio. Premier acompte reçu en semaine 4.”</blockquote><figcaption className="muted">Étudiant en marketing digital — Côte d’Ivoire</figcaption></figure>
              <figure className="card home-testimonial"><blockquote>“Les scripts de prospection m’ont fait gagner des semaines. Je sais maintenant quoi dire à une entreprise.”</blockquote><figcaption className="muted">Étudiante en design — Togo</figcaption></figure>
            </div>
          </section>
          <section className="section">
            <div className="card home-emphasis home-coaching">
              <h2>Encadré, pas abandonné</h2>
              <p>Le challenge est structuré par l’équipe Novenetech : missions guidées, feedback sur ton offre, communauté WhatsApp active et coaching sur les relances. Tu ne viens jamais dans le vide : chaque exercice est prévu pour produire un résultat concret au fil des semaines.</p>
              <p>À la fin : ton mini-portfolio, ton CRM rempli de vrais prospects et ton premier client décroché.</p>
            </div>
          </section>
          <section className="section">
            <h2>Tu hésites ? On répond clairement.</h2>
            <div className="home-faq">
              {faqs.map(([question, answer]) => (
                <details className="card" key={question}><summary>{question}</summary><p>{answer}</p></details>
              ))}
            </div>
          </section>
          <section className="section">
            <div className="card home-join">
              <h2>Ta place dans la cohorte t’attend.</h2>
              <p>Réserve maintenant — place validée après paiement.</p>
              <div className="home-actions">
                <Link className="btn" href="/login">Rejoindre la cohorte — 25 000 FCFA →</Link>
                <a className="btn btn2" href={whatsapp} target="_blank" rel="noopener noreferrer">Pose ta question sur WhatsApp</a>
              </div>
            </div>
          </section>
        </main>
      </div>
      <footer className="home-footer">
        <div className="wrap">
          <Brand />
          <nav className="home-footer-links" aria-label="Navigation de pied de page">
            <Link href="/programme">Programme</Link><Link href="/login">Rejoindre la cohorte</Link><Link href="/login">Espace étudiant</Link><a href={whatsapp} target="_blank" rel="noopener noreferrer">22952527913</a>
          </nav>
          <small className="muted">© 2026 Novenetech — Challenge 28 jours • 25 000 FCFA • encadrement 4 semaines</small>
        </div>
      </footer>
      <a className="home-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Nous contacter sur WhatsApp">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.1-4.4A8.5 8.5 0 1 1 20 11.5Z" /><path d="M8 7.5c-1 3 2.5 6.5 5.5 7l1.5-1.7-2-1-1 1c-1.5-.6-2.3-1.4-2.8-2.8l.8-1-1-2Z" /></svg>
      </a>
    </div>
  );
}
