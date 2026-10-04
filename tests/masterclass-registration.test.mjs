import test from 'node:test';
import assert from 'node:assert/strict';
import { getPriorityPlacesRemaining, normalizeWhatsAppNumber, MASTERCLASS_PRIORITY_CAPACITY } from '../src/lib/masterclass-registration.ts';

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