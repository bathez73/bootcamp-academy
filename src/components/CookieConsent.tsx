'use client';

import { useEffect, useRef, useState } from 'react';
import {
  COOKIE_CONSENT_STORAGE_KEY,
  type CookieConsentChoice,
} from '@/lib/marketing-config';

export type CookieConsentState = {
  choice: CookieConsentChoice | null;
  marketingConsent: boolean;
  eventConsent: boolean;
};

type CookieConsentProps = {
  onReady?: (state: CookieConsentState) => void;
};

const defaultState: CookieConsentState = {
  choice: null,
  marketingConsent: false,
  eventConsent: true,
};

export function readCookieConsent(): CookieConsentState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const storedChoice = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const choice = storedChoice === 'accepted' || storedChoice === 'refused' ? storedChoice : null;
    return {
      choice,
      marketingConsent: choice === 'accepted',
      eventConsent: true,
    };
  } catch {
    return defaultState;
  }
}

export function CookieConsent({ onReady }: CookieConsentProps) {
  const [state, setState] = useState<CookieConsentState>(defaultState);
  const [visible, setVisible] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = readCookieConsent();
    window.setTimeout(() => {
      setState(initial);
      setVisible(initial.choice === null);
      onReady?.(initial);
    }, 0);
  }, [onReady]);

  function persist(choice: CookieConsentChoice) {
    setState({ choice, marketingConsent: choice === 'accepted', eventConsent: true });
    setVisible(false);
    setShowPanel(false);
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
    } catch {
      // Le consentement reste disponible pour la session courante.
    }
    onReady?.({ choice, marketingConsent: choice === 'accepted', eventConsent: true });
  }

  function openPanel() {
    setShowPanel(true);
    window.setTimeout(() => panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus(), 0);
  }

  return (
    <>
      {visible && (
        <aside className="masterclass-cookie-banner" aria-label="Consentement cookies">
          <div>
            <strong>Respect de votre vie privée</strong>
            <p>Nous utilisons des cookies de mesure pour comprendre l&apos;utilisation de cette page et mesurer l&apos;efficacité de nos publicités. Vous pouvez accepter ou refuser.</p>
            <a href="/politique-de-confidentialite">Politique de confidentialité</a>
          </div>
          <div className="masterclass-cookie-actions">
            <button type="button" className="masterclass-cookie-button masterclass-cookie-button-secondary" onClick={() => persist('refused')}>Refuser</button>
            <button type="button" className="masterclass-cookie-button masterclass-cookie-button-primary" onClick={() => persist('accepted')}>Accepter</button>
          </div>
        </aside>
      )}
      {showPanel && (
        <div className="masterclass-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-panel-title" ref={panelRef}>
          <div className="masterclass-cookie-panel-card">
            <h2 id="cookie-panel-title">Gérer mes cookies</h2>
            <p>Le tracking de mesure est {state.marketingConsent ? 'activé' : 'désactivé'}.</p>
            <div className="masterclass-cookie-choice">
              <span>Suivi de mesure</span>
              <button type="button" className={state.marketingConsent ? 'is-active' : ''} onClick={() => persist('accepted')}>Accepter</button>
              <button type="button" className={!state.marketingConsent ? 'is-active' : ''} onClick={() => persist('refused')}>Refuser</button>
            </div>
            <a href="/politique-de-confidentialite">Politique de confidentialité</a>
            <button type="button" className="masterclass-cookie-close" onClick={() => setShowPanel(false)}>Fermer</button>
          </div>
        </div>
      )}
      <button type="button" className="masterclass-cookie-manage" onClick={openPanel} aria-label="Gérer mes cookies">Gérer mes cookies</button>
    </>
  );
}
