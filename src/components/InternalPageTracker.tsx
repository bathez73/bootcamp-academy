'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { observeInternalPageView } from '@/lib/internal-pageviews';

export default function InternalPageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const observe = () => {
      if (document.visibilityState === 'visible') observeInternalPageView(pathname);
    };
    observe();
    document.addEventListener('visibilitychange', observe);
    return () => document.removeEventListener('visibilitychange', observe);
  }, [pathname]);
  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) observeInternalPageView(window.location.pathname, true);
    };
    window.addEventListener('pageshow', restored);
    return () => window.removeEventListener('pageshow', restored);
  }, []);
  return null;
}
