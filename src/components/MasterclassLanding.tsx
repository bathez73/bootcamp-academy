'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Brand from '@/components/Brand';
import {
  buildTrackedHref,
  getEventUtcTimestamp,
  getUTMParameters,
  normalizeWhatsAppNumber,
  sanitizeUTMParameters,
} from '@/lib/masterclass-registration';

type RegistrationResult = {
  ok?: boolean;
  error?: string;
};

const EVENT_AT = getEventUtcTimestamp();
const WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/FMoQAjUu9nk6z5X40nadbq';
const PLACES_RESTANTES: number | null = null; // TODO_CONTENU: renseigner uniquement un décompte confirmé.
const FAQ_ITEMS = [
  ['La masterclass est-elle vraiment gratuite ?', 'Oui. La réservation et la participation à cette session en ligne sont gratuites.'],
  ['À quelle heure dois-je me connecter ?', 'Samedi 24 octobre · 19h00 GMT (20h00 Bénin/Cameroun).'],
  ['Comment vais-je recevoir le lien d’accès ?', 'Les informations pratiques et le lien du LIVE seront partagés dans le groupe WhatsApp officiel de la masterclass.'],
  ['Faut-il déjà avoir une compétence digitale ?', 'Non. La session est conçue pour t’aider à aller du savoir-faire à une offre claire, même en commençant avec peu de structure.'],
  ['Est-ce que la masterclass garantit un premier client ou un revenu ?', 'Non. Elle donne une méthode et des outils concrets pour tester une offre, mais les résultats dépendent de ton action, de ton marché et de tes démarches.'],
  ['Y aura-t-il un replay ?', 'TODO_CONTENU : confirmer si un replay sera disponible et ses conditions d’accès.'],
  ['Sur quelle plateforme aura lieu le LIVE ?', 'TODO_CONTENU : confirmer la plateforme de diffusion avant publication.'],
  ['Puis-je suivre la masterclass depuis un téléphone ?', 'TODO_CONTENU : confirmer les conditions de suivi depuis un téléphone selon la plateforme retenue.'],
];

type LandingConversionEvent = 'landing_view' | 'cta_click' | 'form_view' | 'form_start' | 'form_submit' | 'registration_complete' | 'whatsapp_click';

function trackConversion(event: LandingConversionEvent, extra: Record<string, string> = {}) {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as Window & {
    dataLayer?: Array<Record<string, string | Record<string, string>>>;
    fbq?: (...args: unknown[]) => void;
  };

  const utmData = getUTMParameters(window.location.href);
  const payload = { event, ...utmData, ...extra };
  window.dispatchEvent(new CustomEvent('masterclass:conversion', { detail: payload }));
  analyticsWindow.dataLayer?.push(payload);
}

function trackMetaLead() {
  if (typeof window === 'undefined') return;
  const analyticsWindow = window as Window & { fbq?: (...args: unknown[]) => void };
  if (typeof analyticsWindow.fbq === 'function') {
    analyticsWindow.fbq('track', 'Lead');
  }
}

const agenda = [
  {
    number: '01',
    title: 'Compétence → problème',
    description: 'Identifier ce que tu sais faire, le besoin réel qu’il peut résoudre et la valeur qu’une offre peut créer.',
  },
  {
    number: '02',
    title: 'Problème → cible',
    description: 'Définir la personne ou l’entreprise qui a besoin de cette solution et pourquoi elle a besoin de toi.',
  },
  {
    number: '03',
    title: 'Offre → message',
    description: 'Transformer une compétence en une offre simple et préparer le premier message de prospection adapté.',
  },
  {
    number: '04',
    title: 'Prospect → premier contact',
    description: 'Poser une première conversation claire, utile et crédible sans pression ni promesse irréaliste.',
  },
  {
    number: '05',
    title: 'Client → test de traction',
    description: 'Valider une piste commerciale, apprendre rapidement et ajuster ton offre selon le retour réel.',
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

function getLocalEventSummary() {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(EVENT_AT));
  } catch {
    return '19:00 GMT';
  }
}

function subscribeToTimeZoneChanges() {
  return () => undefined;
}

function getServerEventTime() {
  return '19:00 GMT';
}

const EMPTY_UTM_PARAMETERS: Record<string, string> = {};
let cachedUtmLocation = '';
let cachedUtmParameters = EMPTY_UTM_PARAMETERS;

function getLandingUtmParameters() {
  if (typeof window === 'undefined') return EMPTY_UTM_PARAMETERS;
  if (window.location.href === cachedUtmLocation) return cachedUtmParameters;

  const fromUrl = getUTMParameters(window.location.href);
  let params = fromUrl;
  if (!Object.keys(fromUrl).length) {
    try {
      params = sanitizeUTMParameters(JSON.parse(window.sessionStorage.getItem('masterclass_utm') || '{}'));
    } catch {
      params = EMPTY_UTM_PARAMETERS;
    }
  }

  cachedUtmLocation = window.location.href;
  cachedUtmParameters = params;
  return cachedUtmParameters;
}

function getCalendarHref() {
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Novenetech//Masterclass//FR',
    'BEGIN:VEVENT',
    'UID:masterclass-20261024T190000Z@novenetech',
    'DTSTAMP:20261006T000000Z',
    'DTSTART:20261024T190000Z',
    'DTEND:20261024T201500Z',
    'SUMMARY:Masterclass - De 0 à ton premier client digital',
    'DESCRIPTION:Masterclass en ligne Novenetech',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
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

export default function MasterclassLanding() {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [whatsAppUrl, setWhatsAppUrl] = useState('');
  const [otherDialCodeSelected, setOtherDialCodeSelected] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);
  const utmParams = useSyncExternalStore(subscribeToTimeZoneChanges, getLandingUtmParameters, () => EMPTY_UTM_PARAMETERS);
  const localEventDate = useSyncExternalStore(subscribeToTimeZoneChanges, getLocalEventSummary, getServerEventTime);
  const [heroEmail, setHeroEmail] = useState('');
  const [heroWhatsapp, setHeroWhatsapp] = useState('');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationCountryCode, setRegistrationCountryCode] = useState('+229');
  const [registrationWhatsapp, setRegistrationWhatsapp] = useState('');
  const [registrationOtherDialCode, setRegistrationOtherDialCode] = useState('');
  const [heroError, setHeroError] = useState('');
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const formStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (Object.keys(utmParams).length) {
      try {
        window.sessionStorage.setItem('masterclass_utm', JSON.stringify(utmParams));
      } catch {
        return;
      }
    }
  }, [utmParams]);

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

  const ctaLink = (hash: string) => buildTrackedHref(hash, utmParams);

  function continueFromHero(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHeroError('');
    setError('');
    const normalizedPhone = normalizeWhatsAppNumber(heroWhatsapp);
    if (!normalizedPhone) {
      setHeroError('Indique un numéro WhatsApp international valide.');
      return;
    }

    const supportedCodes = ['+237', '+243', '+242', '+234', '+229', '+228', '+226', '+225', '+221', '+49', '+44', '+33', '+1'];
    const dialCode = supportedCodes.find((code) => normalizedPhone.startsWith(code));
    const isSupportedCode = Boolean(dialCode);
    setRegistrationEmail(heroEmail.trim());
    setRegistrationCountryCode(isSupportedCode ? dialCode! : 'other');
    setOtherDialCodeSelected(!isSupportedCode);
    setRegistrationOtherDialCode('');
    setRegistrationWhatsapp(isSupportedCode ? normalizedPhone.slice(dialCode!.length) : '');
    if (!isSupportedCode) {
      const message = 'Indicatif non reconnu automatiquement. Sélectionne « Autre » et saisis ton indicatif dans le formulaire complet.';
      setHeroError(message);
      setError(message);
    }
    trackConversion('form_start', { source: 'hero' });
    document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('masterclass-name')?.focus({ preventScroll: true }), 350);
  }

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
      ...utmParams,
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

      const joinGroupUrl = ctaLink(WHATSAPP_GROUP_URL);
      setWhatsAppUrl(joinGroupUrl);
      trackConversion('registration_complete');
      trackMetaLead();
      openWhatsAppLink(joinGroupUrl);
      document.getElementById('masterclass-registration-confirmation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      setError('Connexion indisponible. Vérifie ton réseau puis réessaie.');
    } finally {
      setSubmitting(false);
    }
  }

  const countdown = remainingTime === null ? null : formatCountdown(remainingTime);

  return (
    <div className="masterclass-page">
      <header className="masterclass-header">
        <div className="masterclass-shell masterclass-header-inner">
          <Brand />
          <a className="masterclass-header-cta" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement</a>
        </div>
      </header>

      <main>
        <section className="masterclass-hero">
          <div className="masterclass-shell masterclass-hero-grid">
            <div className="masterclass-hero-copy">
              <p className="masterclass-kicker"><span /> MASTERCLASS GRATUITE <i /> EN LIGNE</p>
              <h1>De 0 à ton premier <em>client digital</em></h1>
              <p className="masterclass-lede">Tu as une compétence digitale mais tu ne sais pas encore quoi vendre, à qui le vendre ou comment trouver tes premiers prospects ? Cette masterclass va te montrer une méthode claire pour passer de la compétence à une offre concrète.</p>
              <p className="masterclass-hero-note">Masterclass gratuite ouverte aux étudiants, jeunes talents et futurs freelances de toute l’Afrique francophone.</p>
              <div className="masterclass-hero-actions">
                <form className="masterclass-hero-form" onSubmit={continueFromHero}>
                  <label htmlFor="masterclass-hero-email">Adresse e-mail</label>
                  <input id="masterclass-hero-email" type="email" autoComplete="email" required value={heroEmail} onChange={(event) => setHeroEmail(event.currentTarget.value)} placeholder="toi@exemple.com" />
                  <label htmlFor="masterclass-hero-whatsapp">Numéro WhatsApp international</label>
                  <input id="masterclass-hero-whatsapp" type="tel" autoComplete="tel" inputMode="tel" required value={heroWhatsapp} onChange={(event) => setHeroWhatsapp(event.currentTarget.value)} placeholder="+229 52 52 79 13" />
                  {heroError && <p className="masterclass-form-error" role="alert">{heroError}</p>}
                  <button ref={heroCtaRef} className="masterclass-button" type="submit" onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↘</span></button>
                </form>
                <p>Gratuit <span>•</span> En ligne <span>•</span> 19h00 GMT (20h00 Bénin/Cameroun)</p>
              </div>
              <div className="masterclass-proofline">
                <span>Avec Bathez Bankole</span>
                <span>Samedi 24 octobre · 19h00 GMT (20h00 Bénin/Cameroun)</span>
              </div>
            </div>

            <figure className="masterclass-hero-portrait">
              <picture>
                <source srcSet="/bathez-bankole.avif" type="image/avif" />
                <Image
                  src="/bathez-bankole.webp"
                  alt="Bathez Bankole, présentateur de la masterclass Novenetech"
                  width={1278}
                  height={1231}
                  sizes="(max-width: 650px) calc(100vw - 36px), (max-width: 900px) 42vw, 34vw"
                  loading="eager"
                  priority
                  unoptimized
                  style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                />
              </picture>
              <figcaption className="masterclass-portrait-label">Bathez Bankole <span>·</span> Fondateur de Novenetech</figcaption>
            </figure>

            <aside className="masterclass-event-panel" aria-label="Informations de la masterclass">
              <div className="masterclass-panel-top"><span className="masterclass-live-dot" /> Masterclass live</div>
              <div className="masterclass-event-timing">
                <p className="masterclass-date-number">24<span>OCT</span></p>
                <p className="masterclass-time">19<span>h</span>00</p>
              </div>
              <p className="masterclass-panel-note">Samedi 24 octobre · 19h00 GMT (20h00 Bénin/Cameroun)</p>
              <p className="masterclass-timezone local-timezone">Chez vous : {localEventDate}</p>
              <p className="masterclass-seat-count"><strong>Capacité du LIVE</strong> : 100 participants</p>
            </aside>

            <div className="masterclass-framework" aria-label="Framework de la masterclass">
              <span>Le chemin</span>
              <div><b>Compétence</b><i>→</i><b>Problème</b><i>→</i><b>Offre</b><i>→</i><b>Prospect</b><i>→</i><b>Client</b></div>
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
            <a href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-section masterclass-problem-section">
          <div className="masterclass-shell masterclass-problem-grid">
            <div>
              <p className="masterclass-section-label">Le vrai point de départ</p>
              <h2>Tu ne repartiras pas avec une simple liste de métiers digitaux.</h2>
            </div>
            <div className="masterclass-problem-copy">
              <p className="masterclass-lead-claim">Tu repartiras avec une compétence de départ, une cible, une offre simple et un premier plan de prospection à tester.</p>
              <p>Tu ne partiras pas avec une promesse de revenu. Tu partiras avec une méthode concrète pour passer de la compétence à un service clair.</p>
              <div className="masterclass-speaker-signature">
                <div className="masterclass-monogram" aria-hidden="true">BB</div>
                <div><strong>Bathez Bankole</strong><span>Fondateur de Novenetech</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-agenda-section" id="contenu">
          <div className="masterclass-shell">
            <div className="masterclass-section-heading">
              <p className="masterclass-section-label">65 à 75 minutes · concret et interactif</p>
              <h2>Ce que tu vas pouvoir mettre en pratique.</h2>
              <p>Tu vas clarifier une compétence, identifier une cible, construire une offre simple et commencer une prospection plus sérieuse.</p>
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
              <span>La méthode</span>
              <p>Compétence <b>→</b> problème <b>→</b> offre <b>→</b> prospect <b>→</b> client</p>
            </div>
            <div className="masterclass-section-cta">
              <a className="masterclass-button" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-audience-section">
          <div className="masterclass-shell masterclass-audience-grid">
            <div>
              <p className="masterclass-section-label">Pour qui ?</p>
              <h2>Tu peux venir à n’importe quel niveau.</h2>
            </div>
            <div className="masterclass-audience-list">
              <article><span>01</span><p>Etudiants qui veulent développer une compétence monétisable.</p></article>
              <article><span>02</span><p>Jeunes qui maîtrisent Canva, l’IA, les réseaux sociaux, le montage, le web ou d’autres outils, mais ne savent pas comment proposer un service.</p></article>
              <article><span>03</span><p>Débutants qui veulent comprendre comment passer d’une compétence à une offre claire.</p></article>
              <article><span>04</span><p>Jeunes freelances qui n’ont pas encore structuré leur prospection.</p></article>
            </div>
          </div>
          <div className="masterclass-shell masterclass-audience-cta">
            <a className="masterclass-button" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-section masterclass-audience-section">
          <div className="masterclass-shell masterclass-audience-grid">
            <div>
              <p className="masterclass-section-label">Qui animera cette masterclass ?</p>
              <h2>Bathez Bankole</h2>
            </div>
            <div className="masterclass-speaker-layout">
              <Image
                src="/bathez-bankole.webp"
                alt="Bathez Bankole, fondateur de Novenetech"
                width={1278}
                height={1231}
                sizes="(max-width: 650px) 100vw, (max-width: 900px) 40vw, 360px"
                loading="lazy"
                unoptimized
                className="masterclass-speaker-photo"
              />
              <div className="masterclass-speaker-copy">
                <p className="masterclass-speaker-name">Fondateur de Novenetech</p>
                <p>Entrepreneur digital basé au Bénin, il travaille sur des projets liés au développement numérique, à l’acquisition, à l’automatisation et à la création de solutions digitales.</p>
                <p>Cette masterclass a été conçue pour les jeunes qui apprennent des compétences digitales mais ne savent pas encore comment les transformer en une offre claire et commencer à prospecter.</p>
                <div className="masterclass-speaker-metrics" aria-label="Chiffres clés de l’animateur">
                  <article><strong>TODO_CONTENU</strong><span>Chiffre clé 1 à confirmer</span></article>
                  <article><strong>TODO_CONTENU</strong><span>Chiffre clé 2 à confirmer</span></article>
                  <article><strong>TODO_CONTENU</strong><span>Chiffre clé 3 à confirmer</span></article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-testimonials-section" aria-labelledby="masterclass-testimonials-title">
          <div className="masterclass-shell">
            <div className="masterclass-section-heading">
              <p className="masterclass-section-label">Ils en parlent</p>
              <h2 id="masterclass-testimonials-title">Ils en parlent</h2>
            </div>
            <div className="masterclass-testimonial-grid">
              {[1, 2, 3].map((item) => (
                <article className="masterclass-testimonial" key={item}>
                  <p>TODO_CONTENU : témoignage réel à fournir.</p>
                  <span>TODO_CONTENU : prénom et contexte à confirmer.</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-proof-section">
          <div className="masterclass-shell masterclass-proof-shell">
            <div className="masterclass-section-heading masterclass-proof-heading">
              <p className="masterclass-section-label">Pourquoi cette masterclass existe</p>
              <h2>Beaucoup de jeunes apprennent des compétences digitales, mais pas encore la manière de les monétiser.</h2>
            </div>
            <div className="masterclass-proof-copy">
              <p>Beaucoup de jeunes apprennent Canva, l’intelligence artificielle, le community management, le montage, le développement web ou d’autres compétences digitales.</p>
              <p><strong>Mais maîtriser un outil ne suffit pas pour obtenir un client.</strong></p>
              <p>Il faut comprendre quel problème résoudre, pour qui, construire une offre claire et savoir démarrer une conversation commerciale.</p>
              <p>C’est précisément ce que cette masterclass va permettre d’explorer.</p>
            </div>
          </div>
        </section>

        <section className="masterclass-bonus-band">
          <div className="masterclass-shell masterclass-bonus-content">
            <div className="masterclass-bonus-copy">
              <span className="masterclass-bonus-index">Bonus réservé aux participants</span>
              <p><strong>La fiche “Premier client”</strong><br />Tu travailleras sur ta compétence de départ, ta cible, le problème à résoudre, ton offre, ton premier message de prospection et ton mini-plan d’action.</p>
            </div>
            <a className="masterclass-button" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-section masterclass-registration-section" id="inscription" ref={formSectionRef}>
          <div className="masterclass-shell masterclass-registration-grid">
            <div className="masterclass-registration-copy">
              <p className="masterclass-section-label">Réservation gratuite</p>
              <h2>Garde ta soirée du 24 octobre.</h2>
              <p>Samedi 24 octobre · 19h00 GMT (20h00 Bénin/Cameroun). Les informations d’accès, rappel et lien du direct seront communiqués dans le groupe WhatsApp officiel.</p>
              <p className="masterclass-registration-seat">Capacité du LIVE : <strong>100 participants</strong></p>
              <div className="masterclass-registration-facts"><span>100 % gratuit</span><span>En ligne</span><span>Questions en direct</span></div>
              <p className="masterclass-trust-note">Tes informations servent uniquement à gérer ta réservation et à t’envoyer les informations liées à la masterclass.</p>
            </div>

            {whatsAppUrl ? (
              <div className="masterclass-confirmation" id="masterclass-registration-confirmation" role="status" aria-live="polite">
                <span className="masterclass-confirmation-mark" aria-hidden="true">✓</span>
                <p className="masterclass-confirmation-title">Ta place est réservée</p>
                <h3>Dernière étape : rejoins le groupe WhatsApp officiel de la masterclass.</h3>
                <p>Les rappels, informations pratiques et le lien du LIVE seront communiqués dans ce groupe.</p>
                <a className="masterclass-button" href={whatsAppUrl} target="_blank" rel="noopener noreferrer" onClick={() => {
                  trackConversion('whatsapp_click');
                  openWhatsAppLink(whatsAppUrl);
                }}>Rejoindre le groupe WhatsApp <span aria-hidden="true">↗</span></a>
                <a className="masterclass-calendar-button" href={getCalendarHref()} download="masterclass-2026-10-24.ics">Ajouter à mon agenda</a>
                <small>Cette étape prend moins de 10 secondes.</small>
                <button type="button" className="masterclass-text-button" onClick={() => setWhatsAppUrl('')}>Inscrire une autre personne</button>
              </div>
            ) : (
              <form className="masterclass-registration-form" onSubmit={submitRegistration} onFocusCapture={() => {
                if (!formStartedRef.current) {
                  formStartedRef.current = true;
                  trackConversion('form_start');
                }
              }}>
                <div className="masterclass-form-heading"><p>Quelques détails pour réserver</p></div>
                <label htmlFor="masterclass-name">Nom complet</label>
                <input id="masterclass-name" name="fullName" autoComplete="name" minLength={2} maxLength={100} required placeholder="Ex. Amina K. Mensah" />
                <label htmlFor="masterclass-email">Adresse e-mail</label>
                <input id="masterclass-email" name="email" type="email" autoComplete="email" maxLength={254} required value={registrationEmail} onChange={(event) => setRegistrationEmail(event.currentTarget.value)} placeholder="toi@exemple.com" />
                <label htmlFor="masterclass-whatsapp">Numéro WhatsApp avec indicatif pays</label>
                <div className="masterclass-phone-row">
                  <select id="masterclass-country-code" name="countryCode" aria-label="Indicatif téléphonique" value={registrationCountryCode} onChange={(event) => {
                    setRegistrationCountryCode(event.currentTarget.value);
                    setOtherDialCodeSelected(event.currentTarget.value === 'other');
                    if (event.currentTarget.value !== 'other') setRegistrationOtherDialCode('');
                  }}>
                    <option value="+225">CI +225</option>
                    <option value="+221">SN +221</option>
                    <option value="+237">CM +237</option>
                    <option value="+243">CD +243</option>
                    <option value="+242">CG +242</option>
                    <option value="+226">BF +226</option>
                    <option value="+229">BJ +229</option>
                    <option value="+228">TG +228</option>
                    <option value="+33">FR +33</option>
                    <option value="+234">NG +234</option>
                    <option value="+1">US/CA +1</option>
                    <option value="+44">UK +44</option>
                    <option value="+49">DE +49</option>
                    <option value="other">Autre</option>
                  </select>
                  {otherDialCodeSelected && <input className="masterclass-custom-dial-code" type="text" name="otherDialCode" inputMode="tel" autoComplete="tel-country-code" pattern="\+[1-9][0-9]{0,2}" required value={registrationOtherDialCode} onChange={(event) => setRegistrationOtherDialCode(event.currentTarget.value)} aria-label="Saisis ton indicatif, par exemple +49" placeholder="+49" />}
                  <input id="masterclass-whatsapp" name="whatsapp" type="tel" autoComplete="tel-national" inputMode="tel" required value={registrationWhatsapp} onChange={(event) => setRegistrationWhatsapp(event.currentTarget.value)} placeholder="52 52 79 13" aria-describedby="masterclass-phone-hint" />
                </div>
                <small id="masterclass-phone-hint">Choisis ton indicatif, puis saisis ton numéro sans le préfixe international.</small>
                <div className="masterclass-honeypot" aria-hidden="true"><label htmlFor="masterclass-website">Site web</label><input id="masterclass-website" name="website" tabIndex={-1} autoComplete="off" /></div>
                <label className="masterclass-consent"><input type="checkbox" name="consent" required /><span>J’accepte de recevoir par WhatsApp ou e-mail les informations pratiques de cette masterclass. <a href="#" onClick={(event) => event.preventDefault()}>Politique de confidentialité</a>{/* TODO_CONTENU: remplacer # par l’URL publiée de la politique. */}</span></label>
                {error && <p className="masterclass-form-error" role="alert">{error}</p>}
                <button className="masterclass-button" type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement…' : 'Je réserve ma place gratuitement'} <span aria-hidden="true">↗</span>
                </button>
                {PLACES_RESTANTES !== null && PLACES_RESTANTES > 0 && <p className="masterclass-places-remaining">Plus que {PLACES_RESTANTES} places</p>}
                <small className="masterclass-privacy-note">Tes coordonnées servent à gérer ta réservation et à t’envoyer les informations relatives à l’événement.</small>
              </form>
            )}
          </div>
        </section>

        <section className="masterclass-pre-faq-cta" aria-label="Réserver sa place avant les questions">
          <div className="masterclass-shell">
            <p>Le direct est gratuit. Réserve ta place et prépare tes questions.</p>
            <a className="masterclass-button" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
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
            <a className="masterclass-button" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
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
      {stickyCtaVisible && <a className="masterclass-mobile-cta" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>}
    </div>
  );
}
