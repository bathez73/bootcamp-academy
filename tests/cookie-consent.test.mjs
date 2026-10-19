import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCookieConsent, CONSENT_LIFETIME_MS, UNKNOWN_CONSENT } from '../src/lib/cookie-consent.ts';
const now = Date.UTC(2026,9,19);
const choice = (marketing=true) => ({ version:2, choice:marketing?'accepted':'refused', marketing, updatedAt:now-1000, expiresAt:now-1000+CONSENT_LIFETIME_MS });
test('absence, legacy strings, corrupt or expired consent never authorize Meta', () => {
  for(const raw of [null,'accepted','refused','{}','null','invalid',JSON.stringify({...choice(),expiresAt:now-1}), JSON.stringify({...choice(),version:1}),JSON.stringify({...choice(),choice:'refused'}),JSON.stringify({...choice(),updatedAt:now+1000})]) assert.equal(parseCookieConsent(raw,now),UNKNOWN_CONSENT);
});
test('dated acceptance/refusal/customization persist with a bounded lifetime', () => {
  assert.equal(parseCookieConsent(JSON.stringify(choice()),now).marketing,true);
  assert.equal(parseCookieConsent(JSON.stringify(choice(false)),now).marketing,false);
  assert.equal(parseCookieConsent(JSON.stringify({...choice(false),choice:'customized'}),now).choice,'customized');
  assert.equal(parseCookieConsent(JSON.stringify({...choice(),expiresAt:now+999999999999}),now).marketing,false);
});
