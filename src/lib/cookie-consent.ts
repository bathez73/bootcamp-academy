export const COOKIE_CONSENT_STORAGE_KEY = 'bootcamp_academy_cookie_consent';
export const CONSENT_VERSION = 2;
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export type CookieConsentChoice = 'accepted' | 'refused' | 'customized';
export type CookieConsentState = {
  version: 2; choice: CookieConsentChoice | null; marketing: boolean; updatedAt: number; expiresAt: number;
};
export const UNKNOWN_CONSENT: CookieConsentState = Object.freeze({ version: 2, choice: null, marketing: false, updatedAt: 0, expiresAt: 0 });
const DENIED_CONSENT: CookieConsentState = Object.freeze({ version: 2, choice: 'refused', marketing: false, updatedAt: 0, expiresAt: 0 });
function hasDenialCookie() { return document.cookie.split(';').some(item => item.trim() === 'bootcamp_marketing_denied=1'); }

export function parseCookieConsent(raw: string | null, now = Date.now()): CookieConsentState {
  if (!raw) return UNKNOWN_CONSENT;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== CONSENT_VERSION || !['accepted','refused','customized'].includes(value.choice) ||
      typeof value.marketing !== 'boolean' || !Number.isFinite(value.updatedAt) || !Number.isFinite(value.expiresAt) ||
      value.updatedAt > now || value.expiresAt <= now || value.expiresAt - value.updatedAt !== CONSENT_LIFETIME_MS ||
      (value.choice === 'accepted' && !value.marketing) || (value.choice === 'refused' && value.marketing)) return UNKNOWN_CONSENT;
    return value as CookieConsentState;
  } catch { return UNKNOWN_CONSENT; }
}
let cachedRaw: string | null | undefined;
let cached: CookieConsentState = UNKNOWN_CONSENT;
let volatileConsent: CookieConsentState | null = null;
const listeners = new Set<() => void>();
function emit() { listeners.forEach(listener => listener()); }
export function getCookieConsent(): CookieConsentState {
  if (typeof window === 'undefined') return UNKNOWN_CONSENT;
  if (hasDenialCookie()) return DENIED_CONSENT;
  if (volatileConsent) return volatileConsent.expiresAt > Date.now() ? volatileConsent : UNKNOWN_CONSENT;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw !== cachedRaw || (cached.choice && cached.expiresAt <= Date.now())) {
      cachedRaw = raw;
      cached = parseCookieConsent(raw);
    }
    return cached;
  } catch { return UNKNOWN_CONSENT; }
}
export function getServerConsent() { return UNKNOWN_CONSENT; }
export function saveCookieConsent(choice: CookieConsentChoice, marketing: boolean): boolean {
  const now = Date.now();
  const state: CookieConsentState = { version: 2, choice, marketing, updatedAt: now, expiresAt: now + CONSENT_LIFETIME_MS };
  const raw = JSON.stringify(state);
  let persisted = false;
  // A failed write must never resurrect the old accepted value in this document.
  volatileConsent = state;
  try { window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, raw); persisted = true; volatileConsent = null; cachedRaw = raw; cached = state; } catch { /* Current document only. */ }
  if (marketing) {
    document.cookie = 'bootcamp_marketing_denied=; Max-Age=0; Path=/; SameSite=Lax';
  } else if (!persisted) {
    // Essential fallback preference: an old acceptance must not revive on reload.
    document.cookie = 'bootcamp_marketing_denied=1; Max-Age=15552000; Path=/; SameSite=Lax';
    try { window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY); } catch { /* May be read-only. */ }
  }
  if (!marketing) {
    try { window.sessionStorage.removeItem('masterclass_utm'); } catch { /* Optional storage. */ }
  }
  emit();
  return persisted;
}
export function subscribeCookieConsent(listener: () => void) {
  listeners.add(listener);
  const storageChanged = (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY || event.key === null) {
      volatileConsent = null; cachedRaw = undefined; emit();
    }
  };
  window.addEventListener('storage', storageChanged);
  return () => { listeners.delete(listener); window.removeEventListener('storage', storageChanged); };
}
export function refreshCookieConsent() { cachedRaw = undefined; emit(); }
export function openCookiePreferences() { window.dispatchEvent(new Event('cookie-preferences:open')); }
export function canReloadAfterWithdrawal() {
  if (hasDenialCookie()) return true;
  try { return !parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).marketing; } catch { return false; }
}
