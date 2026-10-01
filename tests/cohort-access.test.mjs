import test from 'node:test';
import assert from 'node:assert/strict';
import { getCohortPaymentState } from '../src/lib/cohort-access.ts';

test('cohort payment state grants access only after 25 000 FCFA', () => {
  const notPaid = getCohortPaymentState([]);
  assert.equal(notPaid.hasAccess, false);
  assert.equal(notPaid.remaining, 25000);

  const deposit = getCohortPaymentState([{ amount: 5000, verified: true }]);
  assert.equal(deposit.hasAccess, false);
  assert.equal(deposit.remaining, 20000);

  const full = getCohortPaymentState([{ amount: 5000, verified: true }, { amount: 20000, verified: true }]);
  assert.equal(full.settled, true);
  assert.equal(full.hasAccess, false);
  assert.equal(full.remaining, 0);

  const approved = getCohortPaymentState([{ amount: 5000, verified: true }, { amount: 20000, verified: true }], true);
  assert.equal(approved.hasAccess, true);

  const unverified = getCohortPaymentState([{ amount: 5000, verified: null }, { amount: 20000, verified: true }], true);
  assert.equal(unverified.settled, false);
  assert.equal(unverified.hasAccess, false);
});
