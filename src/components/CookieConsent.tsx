'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isMasterclassPath } from '@/lib/tracking-policy';
import {
  getCookieConsent, getServerConsent, saveCookieConsent, subscribeCookieConsent, openCookiePreferences,
  type CookieConsentChoice,
} from '@/lib/cookie-consent';
import styles from './CookieConsent.module.css';

export function CookieConsent() {
  const pathname = usePathname();
  const state = useSyncExternalStore(subscribeCookieConsent, getCookieConsent, getServerConsent);
  const [marketing, setMarketing] = useState(false);
  const [sessionOnly, setSessionOnly] = useState(false);
  const panelRef = useRef<HTMLDialogElement>(null);
  function openPanel() {
    setMarketing(getCookieConsent().marketing);
    if (!panelRef.current?.open) panelRef.current?.showModal();
  }
  useEffect(() => {
    const open = () => { setMarketing(getCookieConsent().marketing); panelRef.current?.showModal(); };
    window.addEventListener('cookie-preferences:open', open);
    return () => window.removeEventListener('cookie-preferences:open', open);
  }, []);
  function persist(choice: CookieConsentChoice, allowed: boolean) {
    setSessionOnly(!saveCookieConsent(choice, allowed));
    panelRef.current?.close();
  }
  if (isMasterclassPath(pathname)) return null;
  return <div className={styles.root}>
    {state.choice === null && <aside className={styles.banner} aria-label="Vos choix de confidentialité">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>VOTRE VIE PRIVÉE, VOTRE CHOIX</span>
        <h2>Des cookies ? C’est vous qui décidez.</h2>
        <p>Avec votre accord, Meta mesure les visites et inscriptions pour évaluer nos publicités. Sans accord, aucun traceur publicitaire n’est chargé. Vous pouvez vous inscrire et payer dans tous les cas.</p>
        <Link className={styles.policy} href="/politique-de-confidentialite">Lire notre politique de confidentialité</Link>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => persist('accepted', true)}>Tout accepter</button>
        <button type="button" onClick={() => persist('refused', false)}>Tout refuser</button>
        <button type="button" onClick={openPanel}>Personnaliser</button>
      </div>
    </aside>}
    <dialog className={styles.panel} aria-labelledby="cookie-panel-title" aria-describedby="cookie-panel-description" id="cookie-preferences" ref={panelRef}>
      <div className={styles.panelHeading}>
        <h2 id="cookie-panel-title">Vos préférences cookies</h2>
        <button type="button" className={styles.close} onClick={() => panelRef.current?.close()} aria-label="Fermer les préférences cookies">×</button>
      </div>
      <p id="cookie-panel-description">Votre choix est valable 180 jours et peut être modifié à tout moment. Fermer cette fenêtre ne vaut pas acceptation.</p>
      <label className={styles.option}><span><strong>Fonctionnement du site</strong><small>Connexion, sécurité et mémorisation de votre choix. Toujours nécessaires.</small></span><input type="checkbox" checked disabled aria-label="Cookies nécessaires, toujours actifs" /></label>
      <label className={styles.option}><span><strong>Mesure publicitaire Meta</strong><small>Visites et inscriptions confirmées partagées avec Meta pour mesurer les publicités. Facultatif ; distinct des e-mails et messages WhatsApp.</small></span><input type="checkbox" checked={marketing} onChange={event => setMarketing(event.target.checked)} /></label>
      <p className={styles.note}>Votre refus n’empêche ni l’inscription ni le paiement. Le retrait arrête le suivi et peut actualiser la page.</p>
      <div className={styles.actions}>
        <button type="button" onClick={() => persist('accepted', true)}>Tout accepter</button>
        <button type="button" onClick={() => persist('refused', false)}>Tout refuser</button>
        <button type="button" onClick={() => persist('customized', marketing)}>Enregistrer mes choix</button>
      </div>
      <Link className={styles.policy} href="/politique-de-confidentialite">Politique de confidentialité</Link>
    </dialog>
    {sessionOnly && <div className={styles.manageBar} role="status">Le navigateur ne permet pas de mémoriser ce choix après fermeture de cette page.</div>}
  </div>;
}
export function CookieSettingsLink() {
  const pathname = usePathname();
  if (isMasterclassPath(pathname)) return null;
  return <div className={styles.root}><div className={styles.manageBar}><button type="button" className="masterclass-cookie-manage" onClick={openCookiePreferences} aria-haspopup="dialog" aria-controls="cookie-preferences">Gérer mes cookies</button></div></div>;
}
