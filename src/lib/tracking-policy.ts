import { getCookieConsent } from './cookie-consent';

export function isMasterclassPath(pathname: string) {
  return pathname.replace(/\/$/, '') === '/masterclass';
}

export function isMetaTrackingEnabled() {
  if (typeof window === 'undefined') return false;
  return isMasterclassPath(window.location.pathname) || getCookieConsent().marketing;
}
