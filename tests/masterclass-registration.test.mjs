import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPriorityPlacesRemaining,
  normalizeWhatsAppNumber,
  MASTERCLASS_PRIORITY_CAPACITY,
  getEventUtcTimestamp,
  getUTMParameters,
  sanitizeUTMParameters,
  buildTrackedHref,
} from '../src/lib/masterclass-registration.ts';

test('normalizes Benin and international WhatsApp numbers', () => {
  assert.equal(normalizeWhatsAppNumber('52 52 79 13'), '+22952527913');
  assert.equal(normalizeWhatsAppNumber('+33 (6) 12-34-56-78'), '+33612345678');
  assert.equal(normalizeWhatsAppNumber('1234'), null);
});

test('priority capacity reaches zero without closing registrations', () => {
  assert.equal(getPriorityPlacesRemaining(0), MASTERCLASS_PRIORITY_CAPACITY);
  assert.equal(getPriorityPlacesRemaining(37), 63);
  assert.equal(getPriorityPlacesRemaining(100), 0);
  assert.equal(getPriorityPlacesRemaining(125), 0);
});

test('event reference timestamp stays fixed to 19:00 UTC for all geographies', () => {
  assert.equal(getEventUtcTimestamp(), Date.parse('2026-10-24T19:00:00Z'));
});

test('UTM parameters are extracted and preserved from ad links', () => {
  const params = getUTMParameters(new URL('https://example.com/masterclass?utm_source=meta&utm_medium=paid_social&utm_campaign=masterclass_oct24_ci&utm_content=video_hook_01&utm_term=freelance'));
  assert.deepEqual(params, {
    utm_source: 'meta',
    utm_medium: 'paid_social',
    utm_campaign: 'masterclass_oct24_ci',
    utm_content: 'video_hook_01',
    utm_term: 'freelance',
  });
});

test('UTM persistence accepts only known, bounded string parameters', () => {
  assert.deepEqual(sanitizeUTMParameters({
    utm_source: ' meta ',
    utm_campaign: 'october',
    utm_medium: 42,
    unrelated: 'ignored',
    utm_term: 'x'.repeat(256),
  }), {
    utm_source: 'meta',
    utm_campaign: 'october',
  });
});

test('tracked CTA URLs preserve existing query and hash values', () => {
  assert.equal(
    buildTrackedHref('/masterclass?ref=email#inscription', { utm_source: 'meta' }),
    '/masterclass?ref=email&utm_source=meta#inscription',
  );
  assert.equal(
    buildTrackedHref('#inscription', { utm_source: 'meta' }),
    '?utm_source=meta#inscription',
  );
});