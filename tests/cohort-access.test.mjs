import test from 'node:test';
import assert from 'node:assert/strict';
import { hasCohortAccess } from '../src/lib/cohort-access.ts';

test('cohort access requires explicit admin approval', () => {
  assert.equal(hasCohortAccess(null), false);
  assert.equal(hasCohortAccess(undefined), false);
  assert.equal(hasCohortAccess({}), false);
  assert.equal(hasCohortAccess({ cohort_access_approved: null }), false);
  assert.equal(hasCohortAccess({ cohort_access_approved: false }), false);
  assert.equal(hasCohortAccess({ cohort_access_approved: true }), true);
});
