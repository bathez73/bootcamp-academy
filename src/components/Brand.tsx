'use client';

import Link from 'next/link';
import { useId } from 'react';

export default function Brand() {
  const filterId = `logo-background-${useId().replace(/:/g, '')}`;
  return (
    <Link href="/" className="brand site-brand" aria-label="Bootcamp-Academy by Novenetech — Accueil">
      <span className="site-brand-title">Bootcamp-Academy</span>
      <span className="site-brand-signature">
        <span className="site-brand-by">by</span>
        <svg className="site-brand-logo" viewBox="200 250 620 170" width="186" height="51" aria-hidden="true" focusable="false">
          <defs>
            {/* Suppress only near-black pixels of the original JPEG at render time. */}
            <filter id={filterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  12 12 12 0 -0.35" />
            </filter>
          </defs>
          <image href="/novenetech-logo.jpeg" width="1080" height="720" filter={`url(#${filterId})`} />
        </svg>
      </span>
    </Link>
  );
}
