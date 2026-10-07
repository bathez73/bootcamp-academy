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
import {
  COOKIE_CONSENT_STORAGE_KEY,
  MARKETING_CONFIG,
  type CookieConsentChoice,
} from '@/lib/marketing-config';
import { initializeMetaPixel, trackMetaLead } from '@/lib/meta-pixel';
import { CookieConsent } from '@/components/CookieConsent';

type RegistrationResult = {
  ok?: boolean;
  error?: string;
};

const EVENT_AT = getEventUtcTimestamp();
const WHATSAPP_GROUP_URL = MARKETING_CONFIG.WHATSAPP_GROUP_URL;
const PLACES_RESTANTES = MARKETING_CONFIG.PLACES_RESTANTES;
const FAQ_ITEMS = [
  ['La masterclass est-elle vraiment gratuite ?', 'Oui. La réservation et la participation à cette session en ligne sont gratuites.'],
  ['À quelle heure dois-je me connecter ?', 'Samedi 24 octobre · 19h00 GMT (20h00 Bénin/Cameroun).'],
  ['Comment vais-je recevoir le lien d’accès ?', 'Les informations pratiques et le lien du LIVE seront partagés dans le groupe WhatsApp officiel de la masterclass.'],
  ['Faut-il déjà avoir une compétence digitale ?', 'Non. La session est conçue pour t’aider à aller du savoir-faire à une offre claire, même en commençant avec peu de structure.'],
  ['Est-ce que la masterclass garantit un premier client ou un revenu ?', 'Non. Elle donne une méthode et des outils concrets pour tester une offre, mais les résultats dépendent de ton action, de ton marché et de tes démarches.'],
  ['Y aura-t-il un replay ?', 'Non, la masterclass est uniquement en direct. Réserve ta place et rejoins-nous le 24 octobre à 19 h GMT pour poser tes questions en temps réel.'],
];

const SHOW_TESTIMONIALS = MARKETING_CONFIG.SHOW_TESTIMONIALS;
const SHOW_KEY_STATS = true;
const TESTIMONIALS = [
  { quote: "Grâce aux conseils partagés, j'ai réorganisé mon offre et envoyé mon premier devis dès le lendemain matin. La méthode va droit au but.", name: 'Marc', country: "Côte d'Ivoire", tag: 'Commercial / Vente', initial: 'M' },
  { quote: "En seulement 1 heure de masterclass, j'ai structuré un projet qui me bloquait depuis 3 mois. Les étapes à suivre sont d'une précision chirurgicale.", name: 'Koffi', country: 'Bénin', tag: 'Gain de temps / Efficacité', initial: 'K' },
  { quote: "J'ai appliqué la technique recommandée pour ma page d'accueil : j'ai décroché mes 2 premiers clients dans la même semaine.", name: 'Aïcha', country: 'Sénégal', tag: 'Conversion / Inscriptions', initial: 'A' },
  { quote: "Rien que le modèle présenté au milieu de la session m'a fait économiser au moins 150 000 FCFA d'erreurs d'outils inutiles.", name: 'Samuel', country: 'Cameroun', tag: 'Rentabilité / ROI', initial: 'S' },
];

const SPEAKER_STATS = [
  { value: '+15', label: 'projets digitaux accompagnés' },
  { value: '+50', label: 'participants formés' },
  { value: '3+ ans', label: "d'expérience en prospection et closing" },
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

function getLocalEventSummary(timeZone: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(EVENT_AT));
  } catch {
    return '19:00';
  }
}

function subscribeToTimeZoneChanges() {
  return () => undefined;
}

function getServerEventTime() {
  return '19:00';
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
  const [cookieChoice, setCookieChoice] = useState<CookieConsentChoice | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [otherDialCodeSelected, setOtherDialCodeSelected] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);
  const utmParams = useSyncExternalStore(subscribeToTimeZoneChanges, getLandingUtmParameters, () => EMPTY_UTM_PARAMETERS);
  const abidjanTime = useSyncExternalStore(
    subscribeToTimeZoneChanges,
    () => getLocalEventSummary('Africa/Abidjan'),
    getServerEventTime,
  );
  const portoNovoTime = useSyncExternalStore(
    subscribeToTimeZoneChanges,
    () => getLocalEventSummary('Africa/Porto-Novo'),
    getServerEventTime,
  );
  const [heroEmail, setHeroEmail] = useState('');
  const [heroWhatsapp, setHeroWhatsapp] = useState('');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationCountryCode, setRegistrationCountryCode] = useState('+229');
  const [registrationWhatsapp, setRegistrationWhatsapp] = useState('');
  const [registrationOtherDialCode, setRegistrationOtherDialCode] = useState('');
  const [heroError, setHeroError] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const formStartedRef = useRef(false);
  const testimonialTrackRef = useRef<HTMLDivElement>(null);

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
    window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
        setCookieChoice(stored === 'accepted' || stored === 'refused' ? stored : null);
      } catch {
        setCookieChoice(null);
      }
    }, 0);
  }, []);

  useEffect(() => {
    const updateCountdown = () => setRemainingTime(EVENT_AT - Date.now());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  useEffect(() => {
    const track = testimonialTrackRef.current;
    if (!track || window.matchMedia('(min-width: 769px)').matches) return;
    const onScroll = () => {
      const cards = Array.from(track.children) as HTMLElement[];
      const cardWidth = cards[0]?.offsetWidth || 1;
      const index = Math.round(track.scrollLeft / Math.max(cardWidth + 18, 1));
      setTestimonialIndex(Math.min(TESTIMONIALS.length - 1, Math.max(0, index)));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const heroCta = heroCtaRef.current;
    const formSection = formSectionRef.current;
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const heroStages = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-stage]'));
    const counterTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-counter]'));
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
        } else if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      }
      updateSticky();
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((target) => {
      const delay = Number(target.dataset.revealDelay || 0);
      target.style.setProperty('--reveal-delay', `${delay}ms`);
      observer.observe(target);
    });
    heroStages.forEach((stage) => observer.observe(stage));
    counterTargets.forEach((counter) => observer.observe(counter));
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
    const enteredWhatsapp = String(form.get('whatsapp') || '').trim();
    const phoneDigits = enteredWhatsapp.replace(/\D/g, '');
    const normalizedPhone = normalizeWhatsAppNumber(enteredWhatsapp);
    const whatsapp = normalizedPhone || `${dialingCode}${phoneDigits}`;

    const payload = {
      fullName,
      email: String(form.get('email') || ''),
      whatsapp,
      consent: form.get('consent') === 'on',
      eventConsent: form.get('consent') === 'on',
      marketingConsent: form.get('marketingConsent') === 'on',
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
      if (cookieChoice === 'accepted') {
        initializeMetaPixel();
        trackMetaLead();
      }
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
        <div className="masterclass-reading-progress" style={{ transform: `scaleX(${scrollProgress})` }} aria-hidden="true" />
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
              <h1 data-hero-stage>De 0 à ton premier <em>client digital</em></h1>
              <p className="masterclass-lede" data-hero-stage>Tu as une compétence digitale mais tu ne sais pas encore quoi vendre, à qui le vendre ou comment trouver tes premiers prospects ? Cette masterclass va te montrer une méthode claire pour passer de la compétence à une offre concrète.</p>
              <div className="masterclass-mobile-event-summary" data-hero-stage><span>24 OCT</span><strong>19h00 GMT</strong><small>20h00 Bénin/Cameroun</small></div>
              <div className="masterclass-hero-actions" data-hero-stage>
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
              <p className="masterclass-hero-note" data-hero-stage>Masterclass gratuite ouverte aux étudiants, jeunes talents et futurs freelances de toute l’Afrique francophone.</p>
              <div className="masterclass-proofline">
                <span>Avec Bathez Bankole</span>
                <span>Samedi 24 octobre · 19h00 GMT (20h00 Bénin/Cameroun)</span>
              </div>
            </div>

            <figure className="masterclass-hero-portrait" data-hero-stage>
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
              <p className="masterclass-timezone local-timezone">Chez vous : Abidjan {abidjanTime} · Porto-Novo {portoNovoTime}</p>
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
            <div className="masterclass-section-heading" data-reveal>
              <p className="masterclass-section-label">65 à 75 minutes · concret et interactif</p>
              <h2>Ce que tu vas pouvoir mettre en pratique.</h2>
              <p>Tu vas clarifier une compétence, identifier une cible, construire une offre simple et commencer une prospection plus sérieuse.</p>
            </div>
            <div className="masterclass-agenda-list">
              {agenda.map((item, index) => (
                <article className="masterclass-agenda-item" key={item.number} data-reveal data-reveal-delay={index * 60}>
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

        <section className="masterclass-section masterclass-testimonials-section" aria-labelledby="masterclass-testimonials-title">
          <div className="masterclass-shell">
            <div className="masterclass-section-heading" data-reveal>
              <p className="masterclass-section-label">Ils en parlent</p>
              <h2 id="masterclass-testimonials-title">Ils en parlent</h2>
              <p>Retours des participants à ma première session de formation</p>
            </div>
            <div className="masterclass-testimonial-track" ref={testimonialTrackRef} aria-label="Témoignages des participants">
              <div className="masterclass-testimonial-grid">
                {TESTIMONIALS.map((testimonial, index) => (
                  <article className="masterclass-testimonial" key={testimonial.name} data-reveal data-reveal-delay={index * 80}>
                    <span className="masterclass-testimonial-avatar" aria-hidden="true">{testimonial.initial}</span>
                    <p>« {testimonial.quote} »</p>
                    <div><strong>{testimonial.name}, {testimonial.country}</strong><small>{testimonial.tag}</small></div>
                  </article>
                ))}
              </div>
            </div>
            <p className="masterclass-testimonial-disclaimer">Résultats propres à chaque participant, non garantis.</p>
            <div className="masterclass-testimonial-dots" aria-label="Position du carrousel" role="group">
              {TESTIMONIALS.map((testimonial, index) => <button key={testimonial.name} type="button" className={testimonialIndex === index ? 'is-active' : ''} onClick={() => {
                const card = testimonialTrackRef.current?.children[0]?.children[index] as HTMLElement | undefined;
                card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }} aria-label={`Afficher le témoignage ${index + 1}`} />)}
            </div>
          </div>
        </section>

        <section className="masterclass-section masterclass-audience-section">
          <div className="masterclass-shell masterclass-audience-grid">
            <div data-reveal>
              <p className="masterclass-section-label">Pour qui ?</p>
              <h2>Tu peux venir à n’importe quel niveau.</h2>
            </div>
            <div className="masterclass-audience-list">
              {[['01', 'Etudiants qui veulent développer une compétence monétisable.'], ['02', 'Jeunes qui maîtrisent Canva, l’IA, les réseaux sociaux, le montage, le web ou d’autres outils, mais ne savent pas comment proposer un service.'], ['03', 'Débutants qui veulent comprendre comment passer d’une compétence à une offre claire.'], ['04', 'Jeunes freelances qui n’ont pas encore structuré leur prospection.']].map(([number, copy], index) => <article key={number} data-reveal data-reveal-delay={index * 60}><span>{number}</span><p>{copy}</p></article>)}
            </div>
          </div>
          <div className="masterclass-shell masterclass-audience-cta">
            <a className="masterclass-button" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="masterclass-section masterclass-speaker-section">
          <div className="masterclass-shell masterclass-audience-grid">
            <div data-reveal>
              <p className="masterclass-section-label">Qui anime cette masterclass ?</p>
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
                <p className="masterclass-speaker-name" data-reveal>Fondateur de Novenetech</p>
                <p data-reveal>Fondateur de Novenetech, agence spécialisée en développement web, solutions digitales et branding.</p>
                <p data-reveal>Depuis plus de 3 ans, Bathez fait de la prospection et du closing : il sait comment trouver des clients et les convaincre. Il a ensuite lancé Novenetech, accompagné plus de 15 projets digitaux et formé plus de 50 participants.</p>
                <p data-reveal>Cette masterclass est née d'un constat simple : beaucoup de jeunes apprennent des compétences digitales, mais ne savent pas comment les transformer en offre claire et commencer à prospecter.</p>
                <div className="masterclass-speaker-metrics" aria-label="Chiffres clés de l’animateur">
                  {SPEAKER_STATS.map((stat, index) => <article key={stat.label} data-reveal data-reveal-delay={index * 80}><strong data-counter={stat.value}>{stat.value}</strong><span>{stat.label}</span></article>)}
                </div>
              </div>
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
              <p className="masterclass-no-replay">Pas de replay : sois présent(e) le 24 octobre à 19h GMT.</p>
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
                <p className="masterclass-no-replay">Pas de replay : sois présent(e) le 24 octobre à 19h GMT.</p>
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
                <label className="masterclass-consent"><input type="checkbox" name="consent" required /><span>J&apos;accepte que mes données soient utilisées pour gérer mon inscription et m&apos;envoyer par e-mail ou WhatsApp les informations pratiques relatives à cette masterclass.</span><a href="/politique-de-confidentialite">Politique de confidentialité</a></label>
                <label className="masterclass-consent masterclass-marketing-consent"><input type="checkbox" name="marketingConsent" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.currentTarget.checked)} /><span>J&apos;accepte de recevoir des informations sur les prochaines formations et offres de Novenetech.</span></label>
                {error && <p className="masterclass-form-error" role="alert">{error}</p>}
                <button className="masterclass-button" type="submit" disabled={submitting}>
                  {submitting ? <><span className="masterclass-button-spinner" aria-hidden="true" /> Réservation…</> : 'Je réserve ma place gratuitement'} <span aria-hidden="true">↗</span>
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

      <CookieConsent onReady={(nextState) => {
        setCookieChoice(nextState.choice);
        if (nextState.choice === 'accepted') {
          initializeMetaPixel();
        }
      }} />
      <footer className="masterclass-footer">
        <div className="masterclass-shell">
          <p><strong>Bootcamp Academy</strong> by Novenetech</p>
          <span>Novenetech · IFU 0202315600488 · RCCM RB/PNO/26 A 125964 · Sèmè-Podji, Bénin</span>
          <div><Link href="/politique-de-confidentialite">Politique de confidentialité</Link><button type="button" onClick={() => document.querySelector<HTMLButtonElement>('.masterclass-cookie-manage')?.click()}>Gérer mes cookies</button></div>
        </div>
      </footer>
      {stickyCtaVisible && <a className="masterclass-mobile-cta" href={ctaLink('#inscription')} onClick={() => trackConversion('cta_click')}>Je réserve ma place gratuitement <span aria-hidden="true">↗</span></a>}
    </div>
  );
}
