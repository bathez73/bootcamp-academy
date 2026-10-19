import { MARKETING_CONFIG } from '@/lib/marketing-config';
import { canReloadAfterWithdrawal, getCookieConsent } from '@/lib/cookie-consent';
type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: PixelFunction;
  loaded?: boolean; version?: string; disablePushState?: boolean;
};
declare global {
  interface Window { fbq?: PixelFunction; _fbq?: PixelFunction; metaPixelLoaded?: boolean; }
}
const COMMERCIAL_PATHS = new Set(['/', '/masterclass', '/bootcamp', '/academy', '/inscription', '/programme']);
let currentView = '';
let pageViewSent = false;
const sentConversions = new Set<string>();

export function initializeMetaPixel() {
  if (typeof window === 'undefined' || !getCookieConsent().marketing || !MARKETING_CONFIG.META_PIXEL_ID) return false;
  // Never intentionally expose authentication or contact query parameters.
  if ([...new URLSearchParams(window.location.search).keys()].some(key => /^(email|phone|whatsapp|full_?name|token|token_hash|code|password)$/i.test(key))) return false;
  if (window.metaPixelLoaded) { window.fbq?.('consent', 'grant'); return true; }
  // This module is the sole owner of this Pixel. Do not add GTM/automatic events.
  const fbq: PixelFunction = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args);
  } as PixelFunction;
  fbq.queue = []; fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0';
  fbq.disablePushState = true;
  window.fbq = fbq; window._fbq = fbq;
  fbq('consent', 'grant');
  fbq('set', 'autoConfig', false, MARKETING_CONFIG.META_PIXEL_ID);
  fbq('init', MARKETING_CONFIG.META_PIXEL_ID);
  const script = document.createElement('script');
  script.id = 'bootcamp-meta-pixel';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.onerror = () => {
    fbq.queue.length = 0;
    script.remove();
    window.metaPixelLoaded = false;
    // A blocker/network error is not a conversion; do not create a retry storm.
  };
  window.metaPixelLoaded = true;
  document.head.appendChild(script);
  return true;
}
export function observeMetaPageView(pathname: string, query: string, restored = false) {
  const functionalQuery = new URLSearchParams(query);
  // Attribution-only changes (for example fbclid disappearing on an anchor)
  // do not create a new page view.
  for (const key of [...functionalQuery.keys()]) {
    if (/^utm_/i.test(key) || /^(fbclid|gclid|msclkid)$/i.test(key)) functionalQuery.delete(key);
  }
  functionalQuery.sort();
  const meaningfulQuery = functionalQuery.toString();
  const view = pathname + (meaningfulQuery ? '?' + meaningfulQuery : '');
  if (restored || view !== currentView) { currentView = view; pageViewSent = false; }
  if (!COMMERCIAL_PATHS.has(pathname) || !getCookieConsent().marketing || pageViewSent || !initializeMetaPixel()) return;
  window.fbq?.('trackSingle', MARKETING_CONFIG.META_PIXEL_ID, 'PageView', {}, { eventID: crypto.randomUUID() });
  pageViewSent = true;
}
export type RegistrationConfirmation = { ok?: boolean; recorded?: boolean; alreadyRegistered?: boolean; eventId?: string };
export function trackMetaRegistration(result: RegistrationConfirmation, authorizedAtSubmission: boolean) {
  if (!authorizedAtSubmission || !getCookieConsent().marketing || result.ok !== true ||
    result.recorded !== true || result.alreadyRegistered !== false || !result.eventId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.eventId) ||
    sentConversions.has(result.eventId) || !initializeMetaPixel()) return;
  window.fbq?.('trackSingle', MARKETING_CONFIG.META_PIXEL_ID, 'Lead', {}, { eventID: result.eventId });
  sentConversions.add(result.eventId);
}
// Revocation is synchronous at each event gate. Reload also unloads Meta's SDK,
// including any listeners it installed, which removing a script alone cannot do.
export function revokeMetaPixel() {
  if (typeof window === 'undefined') return;
  const loaded = window.metaPixelLoaded;
  if (loaded) {
    window.fbq?.('consent', 'revoke');
    if (window.fbq?.queue) window.fbq.queue.length = 0;
    document.getElementById('bootcamp-meta-pixel')?.remove();
  }
  try { window.sessionStorage.removeItem('masterclass_utm'); } catch { /* Optional storage. */ }
  const labels = window.location.hostname.split('.');
  for (const cookie of ['_fbp','_fbc']) {
    document.cookie = cookie + '=; Max-Age=0; Path=/; SameSite=Lax';
    for (let i = 0; i < labels.length - 1; i++) {
      document.cookie = cookie + '=; Max-Age=0; Path=/; Domain=.' + labels.slice(i).join('.') + '; SameSite=Lax';
    }
  }
  if (loaded && canReloadAfterWithdrawal()) {
    window.metaPixelLoaded = false;
    window.location.reload();
  }
}
