'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Brand from '@/components/Brand';
import { getPriorityPlacesRemaining, MASTERCLASS_PRIORITY_CAPACITY } from '@/lib/masterclass-registration';

type RegistrationResult = {
  ok?: boolean;
  count?: number;
  alreadyRegistered?: boolean;
  error?: string;
};

type MasterclassLandingProps = {
  initialRegistrationCount: number | null;
};

const EVENT_AT = new Date('2026-10-24T20:00:00+01:00').getTime();
const WHATSAPP_NUMBER = '22952527913';
const FAQ_ITEMS = [
  ['La masterclass est-elle vraiment gratuite ?', 'Oui. La réservation et la participation à cette session en ligne sont gratuites.'],
  ['À quelle heure dois-je me connecter ?', 'La salle ouvrira à 19 h 45. Le direct commencera à 20 h, heure du Bénin, le samedi 24 octobre 2026.'],
  ['Comment vais-je recevoir le lien d’accès ?', 'Après ta réservation, ouvre le message WhatsApp prérempli et envoie-le à Novenetech. Les informations pratiques seront ensuite communiquées aux inscrits.'],
  ['Faut-il déjà avoir une compétence digitale ?', 'Non. La session t’aidera à repérer une porte d’entrée et à relier une compétence à un problème client concret.'],
  ['Est-ce que la masterclass garantit un premier client ou un revenu ?', 'Non. Elle présente une méthode et des pistes de mise en pratique ; les résultats dépendent du marché, du travail et des démarches de chacun.'],
];

type LandingConversionEvent = 'landing_view' | 'hero_cta_click' | 'sticky_cta_click' | 'program_cta_click' | 'form_view' | 'form_start' | 'form_submit' | 'registration_success';

function trackConversion(event: LandingConversionEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('masterclass:conversion', { detail: { event } }));
  const analyticsWindow = window as Window & { dataLayer?: Array<Record<string, string>> };
  analyticsWindow.dataLayer?.push({ event });
}

const agenda = [
  {
    number: '01',
    title: 'Une compétence ne suffit pas encore',
    description: 'Comprendre pourquoi un outil ou un savoir-faire doit répondre à un vrai problème pour devenir une offre.',
  },
  {
    number: '02',
    title: 'Choisir une porte d’entrée',
    description: 'Design, IA et rédaction, réseaux sociaux, WhatsApp Business ou web : repérer une piste et commencer par une seule.',
  },
  {
    number: '03',
    title: 'Formuler une offre claire',
    description: 'Compléter une phrase simple : « J’aide [client] à [résultat] grâce à [service]. »',
  },
  {
    number: '04',
    title: 'Voir la méthode en direct',
    description: 'Appliquer le framework à un cas concret, de l’observation du besoin jusqu’au premier message.',
  },
  {
    number: '05',
    title: 'Commencer sa prospection',
    description: 'Découvrir le portfolio démonstratif, le premier message et le Challenge 20 pour organiser ses tests.',
  },
];

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function getWhatsAppLink(name: string) {
  const message = `Bonjour Novenetech, je viens de réserver ma place pour la masterclass « De 0 à ton premier client digital ». Mon nom : ${name}. Merci de m’envoyer les informations pratiques pour le 24 octobre.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function openWhatsAppLink(url: string) {
  if (typeof window === 'undefined') return;
  try {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) window.location.href = url;
  } catch {
    window.location.href = url;
  }
}

export default function MasterclassLanding({ initialRegistrationCount }: MasterclassLandingProps) {
  const [registrationCount, setRegistrationCount] = useState<number | null>(initialRegistrationCount);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [whatsAppUrl, setWhatsAppUrl] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [otherDialCodeSelected, setOtherDialCodeSelected] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);
  const heroCtaRef = useRef<HTMLAnchorElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const formStartedRef = useRef(false);

  useEffect(() => {
    trackConversion('landing_view');
  }, []);

  useEffect(() => {
    const updateCountdown = () => setRemainingTime(EVENT_AT - Date.now());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const heroCta = heroCtaRef.current;
    const formSection = formSectionRef.current;
    if (!heroCta || !formSection || !('IntersectionObserver' in window)) return;

    let heroCtaPassed = false;
    let formVisible = false;
    let formViewTracked = false;
    const updateSticky = () => setStickyCtaVisible(heroCtaPassed && !formVisible);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroCta) {
            if (entry.isIntersecting) heroCtaPassed = false;
            else if (entry.boundingClientRect.top < 0) heroCtaPassed = true;
        } else if (entry.target === formSection) {
          formVisible = entry.isIntersecting;
          if (entry.isIntersecting && !formViewTracked) {
            formViewTracked = true;
            trackConversion('form_view');
          }
        }
      }
      updateSticky();
    }, { threshold: 0.08 });

    observer.observe(heroCta);
    observer.observe(formSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/masterclass-registrations', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ count: number }> : null)
      .then((result) => {
        if (active && result && Number.isFinite(result.count)) setRegistrationCount(result.count);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    trackConversion('form_submit');

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const countryCode = String(form.get('countryCode') || '');
    const otherDialCode = String(form.get('otherDialCode') || '').trim();
    const dialingCode = countryCode === 'other' ? otherDialCode : countryCode;
    let phoneDigits = String(form.get('whatsapp') || '').replace(/\D/g, '');
    if (dialingCode !== '+229' && phoneDigits.startsWith('0')) phoneDigits = phoneDigits.slice(1);
    const payload = {
      fullName,
      email: String(form.get('email') || ''),
      whatsapp: `${dialingCode}${phoneDigits}`,
      consent: form.get('consent') === 'on',
      website: String(form.get('website') || ''),
    };

    try {
      const response = await fetch('/api/masterclass-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as RegistrationResult;
      if (!response.ok || !result.ok) {
        setError(result.error || 'La réservation n’a pas abouti. Réessaie.');
        return;
      }

      const nextWhatsAppUrl = getWhatsAppLink(fullName);
      setRegisteredName(fullName);
      setWhatsAppUrl(nextWhatsAppUrl);
      setAlreadyRegistered(Boolean(result.alreadyRegistered));
      if (typeof result.count === 'number') setRegistrationCount(result.count);
      trackConversion('registration_success');
      openWhatsAppLink(nextWhatsAppUrl);
      document.getElementById('masterclass-registration-confirmation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      setError('Connexion indisponible. Vérifie ton réseau puis réessaie.');
    } finally {
      setSubmitting(false);
    }
  }

  const priorityPlaces = registrationCount === null ? null : getPriorityPlacesRemaining(registrationCount);
  const countdown = remainingTime === null ? null : formatCountdown(remainingTime);

  return (
    <div className="masterclass-page">
      <header className="masterclass-header">
        <div className="masterclass-shell masterclass-header-inner">
          <Brand />
          <a className="masterclass-header-cta" href="#inscription" onClick={() => trackConversion('hero_cta_click')}>Réserver ma place</a>
        </div>
      </header>

      <main>
        <section className="masterclass-hero">
          <div className="masterclass-shell masterclass-hero-grid">
            <div className="masterclass-hero-copy">
              <p className="masterclass-kicker"><span /> MASTERCLASS GRATUITE <i /> EN LIGNE</p>
              <h1>De 0 à ton premier <em>client digital.</em></h1>
              <p className="masterclass-lede">Tu as une compétence, mais tu ne sais pas encore quoi vendre, à qui, ni comment trouver tes premiers prospects ? On va tracer le chemin ensemble.</p>
              <div className="masterclass-hero-actions">
                <a ref={heroCtaRef} className="masterclass-button" href="#inscription" onClick={() => trackConversion('hero_cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↘</span></a>
                <p>Gratuit <span>•</span> En ligne <span>•</span> 100 places prioritaires</p>
              </div>
              <div className="masterclass-proofline">
                <span>Avec Bathez Bankole</span>
                <span>Samedi 24 octobre · 20 h</span>
                <span>Heure du Bénin</span>
              </div>
            </div>

            <figure className="masterclass-hero-portrait">
              <Image
                src="/Portrait%20d%C3%A9coup%C3%A9%20d%E2%80%99un%20homme%20souriant.png"
                alt="Bathez Bankole, présentateur de la masterclass Novenetech"
                fill
                sizes="(max-width: 650px) calc(100vw - 36px), (max-width: 900px) 42vw, 34vw"
                quality={85}
                priority
                style={{ objectFit: 'contain', objectPosition: 'center' }}
              />
              <figcaption className="masterclass-portrait-label">Bathez Bankole <span>·</span> Transformation digitale</figcaption>
            </figure>

            <aside className="masterclass-event-panel" aria-label="Informations de la masterclass">
              <div className="masterclass-panel-top"><span className="masterclass-live-dot" /> Rencontre en ligne</div>
              <div className="masterclass-event-timing">
                <p className="masterclass-date-number">24<span>OCT</span></p>
                <p className="masterclass-time">20<span>h</span>00</p>
              </div>
              <p className="masterclass-panel-note">Samedi 24 octobre · ouverture à 19 h 45</p>
              <p className="masterclass-timezone">Heure du Bénin · accès communiqué aux inscrits</p>
              {priorityPlaces === null ? (
                <p className="masterclass-seat-count">Réservations gratuites ouvertes</p>
              ) : priorityPlaces > 0 ? (
                <p className="masterclass-seat-count"><strong>{priorityPlaces}</strong> places prioritaires restantes <span>sur {MASTERCLASS_PRIORITY_CAPACITY}</span></p>
              ) : (
                <p className="masterclass-seat-count masterclass-seat-full"><strong>Quota prioritaire atteint.</strong> Les inscriptions restent ouvertes.</p>
              )}
            </aside>

            <div className="masterclass-framework" aria-label="Framework de la masterclass">
              <span>Le chemin</span>
              <div><b>Compétence</b><i>→</i><b>Problème</b><i>→</i><b>Offre</b><i>→</i><b>Prospect</b><i>→</i><b>Client</b><i>→</i><b>Revenu</b></div>
            </div>
          </div>
          <div className="masterclass-edge-label" aria-hidden="true">APPRENDRE · APPLIQUER · AVANCER</div>
        </section>

        <section className="masterclass-countdown-band" aria-label="Compte à rebours avant la masterclass">
          <div className="masterclass-shell masterclass-countdown-inner">
            <p>La masterclass commence dans</p>
            {countdown && remainingTime !== null && remainingTime > 0 ? (
              <div className="masterclass-countdown-values">
                <span><b>{countdown.days}</b><small>jours</small></span>
                <span><b>{String(countdown.hours).padStart(2, '0')}</b><small>heures</small></span>
                <span><b>{String(countdown.minutes).padStart(2, '0')}</b><small>minutes</small></span>
                <span><b>{String(countdown.seconds).padStart(2, '0')}</b><small>secondes</small></span>
              </div>
            ) : remainingTime !== null && remainingTime <= 0 ? (
              <p className="masterclass-countdown-ended">La session a commencé</p>
            ) : (
              <div className="masterclass-countdown-values" aria-hidden="true"><span><b>--</b><small>jours</small></span><span><b>--</b><small>heures</small></span><span><b>--</b><small>minutes</small></span><span><b>--</b><small>secondes</small></span></div>
            )}
            <a href="#inscription" onClick={() => trackConversion('program_cta_click')}>Réserver <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-section masterclass-problem-section">
          <div className="masterclass-shell masterclass-problem-grid">
            <div>
              <p className="masterclass-section-label">Le vrai point de départ</p>
              <h2>Apprendre un outil, ce n’est pas encore avoir une offre.</h2>
            </div>
            <div className="masterclass-problem-copy">
              <p className="masterclass-lead-claim">Le marché ne paie pas un outil.<br /><strong>Il paie une solution utile à un problème concret.</strong></p>
              <p>Relie ce que tu sais faire à un besoin réel, formule une offre claire et prépare un premier message de prospection.</p>
              <div className="masterclass-speaker-signature">
                <div className="masterclass-monogram" aria-hidden="true">BB</div>
                <div><strong>Bathez Bankole</strong><span>Entrepreneur · accompagnement en transformation digitale</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-agenda-section" id="contenu">
          <div className="masterclass-shell">
            <div className="masterclass-section-heading">
              <p className="masterclass-section-label">65 à 75 minutes · concret et interactif</p>
              <h2>À la fin, tu sauras quoi explorer ensuite.</h2>
              <p>Pas de promesse d’argent facile. Une méthode pour choisir une piste, construire ton offre et démarrer une prospection honnête.</p>
            </div>
            <div className="masterclass-agenda-list">
              {agenda.map((item) => (
                <article className="masterclass-agenda-item" key={item.number}>
                  <span className="masterclass-agenda-number">{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
            <div className="masterclass-formula">
              <span>Ta phrase de départ</span>
              <p>J’aide <b>[un type de client]</b> à <b>[obtenir un résultat]</b> grâce à <b>[mon service]</b>.</p>
            </div>
            <div className="masterclass-section-cta">
              <a className="masterclass-button" href="#inscription" onClick={() => trackConversion('program_cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-audience-section">
          <div className="masterclass-shell masterclass-audience-grid">
            <div>
              <p className="masterclass-section-label">Pour qui ?</p>
              <h2>Tu n’as pas besoin d’avoir déjà tout compris.</h2>
            </div>
            <div className="masterclass-audience-list">
              <article><span>01</span><p>Tu es étudiant et tu veux explorer une activité digitale à côté de tes études.</p></article>
              <article><span>02</span><p>Tu sais déjà utiliser un outil mais tu ne sais pas encore comment en faire un service clair.</p></article>
              <article><span>03</span><p>Tu aides une entreprise ou un projet et tu veux mieux comprendre les opportunités digitales.</p></article>
            </div>
          </div>
          <div className="masterclass-shell masterclass-audience-cta">
            <a className="masterclass-button" href="#inscription" onClick={() => trackConversion('program_cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-bonus-band">
          <div className="masterclass-shell masterclass-bonus-content">
            <span className="masterclass-bonus-index">À la fin du direct</span>
            <p>Un cadeau sera réservé aux personnes présentes.<br /><strong>On garde la surprise pour le live.</strong></p>
            <a className="masterclass-button" href="#inscription" onClick={() => trackConversion('program_cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-section masterclass-registration-section" id="inscription" ref={formSectionRef}>
          <div className="masterclass-shell masterclass-registration-grid">
            <div className="masterclass-registration-copy">
              <p className="masterclass-section-label">Réservation gratuite</p>
              <h2>Garde ta soirée du 24 octobre.</h2>
              <p>La salle en ligne ouvrira à 19 h 45. La masterclass commencera à 20 h, heure du Bénin. Les informations d’accès seront transmises aux inscrits sur WhatsApp.</p>
              {priorityPlaces === null ? (
                <p className="masterclass-registration-seat">Inscriptions gratuites ouvertes.</p>
              ) : priorityPlaces > 0 ? (
                <p className="masterclass-registration-seat">Il reste <strong>{priorityPlaces} places prioritaires</strong> sur 100. Les inscriptions resteront possibles ensuite.</p>
              ) : (
                <p className="masterclass-registration-seat">Les 100 places prioritaires sont attribuées ; les inscriptions restent ouvertes.</p>
              )}
              <div className="masterclass-registration-facts"><span>100 % gratuit</span><span>En ligne</span><span>Questions en direct</span></div>
              <p className="masterclass-trust-note">Tes informations servent uniquement à gérer ton inscription et à t’envoyer les informations liées à la masterclass.</p>
            </div>

            {whatsAppUrl ? (
              <div className="masterclass-confirmation" id="masterclass-registration-confirmation" role="status" aria-live="polite">
                <span className="masterclass-confirmation-mark" aria-hidden="true">✓</span>
                <p className="masterclass-section-label">{alreadyRegistered ? 'Ta réservation existe déjà' : 'C’est réservé'}</p>
                <h3>Merci{registeredName ? `, ${registeredName.split(' ')[0]}` : ''}.</h3>
                <p>Ta place est enregistrée. Le message WhatsApp avec tes informations pratiques a été préparé automatiquement. Si la fenêtre ne s’ouvre pas, utilise le bouton ci-dessous.</p>
                <a className="masterclass-button" href={whatsAppUrl} target="_blank" rel="noopener noreferrer" onClick={() => openWhatsAppLink(whatsAppUrl)}>Ouvrir WhatsApp <span aria-hidden="true">↗</span></a>
                <small>Tu as juste à confirmer l’envoi dans WhatsApp pour recevoir le lien d’accès.</small>
                <button type="button" className="masterclass-text-button" onClick={() => { setWhatsAppUrl(''); setRegisteredName(''); }}>Inscrire une autre personne</button>
              </div>
            ) : (
              <form className="masterclass-registration-form" onSubmit={submitRegistration} onFocusCapture={() => {
                if (!formStartedRef.current) {
                  formStartedRef.current = true;
                  trackConversion('form_start');
                }
              }}>
                <div className="masterclass-form-heading"><span>01 / 03</span><p>Quelques détails pour réserver</p></div>
                <label htmlFor="masterclass-name">Nom complet</label>
                <input id="masterclass-name" name="fullName" autoComplete="name" minLength={2} maxLength={100} required placeholder="Ex. Amina K. Mensah" />
                <label htmlFor="masterclass-email">Adresse email</label>
                <input id="masterclass-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="toi@exemple.com" />
                <label htmlFor="masterclass-whatsapp">Numéro WhatsApp</label>
                <div className="masterclass-phone-row">
                  <select id="masterclass-country-code" name="countryCode" aria-label="Indicatif téléphonique" defaultValue="+229" onChange={(event) => setOtherDialCodeSelected(event.currentTarget.value === 'other')}>
                    <option value="+229">BJ +229</option>
                    <option value="+228">TG +228</option>
                    <option value="+225">CI +225</option>
                    <option value="+221">SN +221</option>
                    <option value="+226">BF +226</option>
                    <option value="+33">FR +33</option>
                    <option value="+1">US/CA +1</option>
                    <option value="+234">NG +234</option>
                    <option value="other">Autre</option>
                  </select>
                  {otherDialCodeSelected && <input className="masterclass-custom-dial-code" type="text" name="otherDialCode" inputMode="tel" autoComplete="tel-country-code" pattern="\+[1-9][0-9]{0,2}" required aria-label="Saisis ton indicatif, par exemple +49" placeholder="+49" />}
                  <input id="masterclass-whatsapp" name="whatsapp" type="tel" autoComplete="tel-national" inputMode="tel" required placeholder="52 52 79 13" aria-describedby="masterclass-phone-hint" />
                </div>
                <small id="masterclass-phone-hint">Choisis ton indicatif, puis saisis ton numéro sans le préfixe international.</small>
                <div className="masterclass-honeypot" aria-hidden="true"><label htmlFor="masterclass-website">Site web</label><input id="masterclass-website" name="website" tabIndex={-1} autoComplete="off" /></div>
                <label className="masterclass-consent"><input type="checkbox" name="consent" required /><span>J’accepte de recevoir par WhatsApp ou email les informations pratiques de cette masterclass et de Novenetech Campus.</span></label>
                {error && <p className="masterclass-form-error" role="alert">{error}</p>}
                <button className="masterclass-button" type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement…' : 'Réserver gratuitement'} <span aria-hidden="true">↗</span>
                </button>
                <small className="masterclass-privacy-note">Tes coordonnées servent à gérer ta réservation et à t’envoyer les informations relatives à l’événement.</small>
              </form>
            )}
          </div>
        </section>

        <section className="masterclass-pre-faq-cta" aria-label="Réserver sa place avant les questions">
          <div className="masterclass-shell">
            <p>Le direct est gratuit. Réserve ta place et prépare tes questions.</p>
            <a className="masterclass-button" href="#inscription" onClick={() => trackConversion('program_cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-faq-section">
          <div className="masterclass-shell masterclass-faq-grid">
            <div><p className="masterclass-section-label">Questions pratiques</p><h2>Avant de réserver.</h2></div>
            <div className="masterclass-faq-list">
              {FAQ_ITEMS.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                const answerId = `masterclass-faq-answer-${index}`;
                return (
                  <div className={`masterclass-faq-item${isOpen ? ' is-open' : ''}`} key={question}>
                    <button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenFaq(isOpen ? null : index)}>
                      {question}<span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    </button>
                    <div className="masterclass-faq-answer" id={answerId} hidden={!isOpen}><p>{answer}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="masterclass-shell masterclass-faq-cta">
            <a className="masterclass-button" href="#inscription" onClick={() => trackConversion('program_cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>

      <footer className="masterclass-footer">
        <div className="masterclass-shell">
          <p><strong>Bootcamp Academy</strong> by Novenetech</p>
          <span>Des compétences aujourd’hui. Des opportunités demain.</span>
          <Link href="/">Découvrir Novenetech Campus</Link>
        </div>
      </footer>
      {stickyCtaVisible && <a className="masterclass-mobile-cta" href="#inscription" onClick={() => trackConversion('sticky_cta_click')}>Réserver ma place <span aria-hidden="true">↗</span></a>}
    </div>
  );
}
