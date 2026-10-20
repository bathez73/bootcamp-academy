'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getCookieConsent, getServerConsent, refreshCookieConsent, subscribeCookieConsent } from '@/lib/cookie-consent';
import { isMetaTrackingEnabled } from '@/lib/tracking-policy';
import { observeMetaPageView, revokeMetaPixel } from '@/lib/meta-pixel';

export default function MetaPageTracker() {
  const consent = useSyncExternalStore(subscribeCookieConsent, getCookieConsent, getServerConsent);
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  useEffect(() => {
    if (!isMetaTrackingEnabled()) revokeMetaPixel();
    observeMetaPageView(pathname, query);
  }, [pathname, query, consent]);
  useEffect(() => {
    if (!consent.expiresAt) return;
    const timer = window.setTimeout(refreshCookieConsent, Math.min(2147483647, Math.max(0, consent.expiresAt - Date.now())));
    return () => window.clearTimeout(timer);
  }, [consent]);
  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      refreshCookieConsent();
      if (event.persisted) observeMetaPageView(window.location.pathname, window.location.search.slice(1), true);
    };
    window.addEventListener('pageshow', restored);
    return () => window.removeEventListener('pageshow', restored);
  }, []);
  return null;
}
