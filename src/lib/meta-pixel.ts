import { MARKETING_CONFIG } from '@/lib/marketing-config';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    metaPixelLoaded?: boolean;
  }
}

export function initializeMetaPixel() {
  if (typeof window === 'undefined' || !MARKETING_CONFIG.META_PIXEL_ID) return false;
  if (window.metaPixelLoaded) return true;

  const pixelScript = document.createElement('script');
  pixelScript.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${MARKETING_CONFIG.META_PIXEL_ID}');fbq('track','PageView');`;
  document.head.appendChild(pixelScript);
  window.metaPixelLoaded = true;
  return true;
}

export function trackMetaLead() {
  if (typeof window === 'undefined' || !window.metaPixelLoaded) return;
  window.fbq?.('track', 'Lead');
}
