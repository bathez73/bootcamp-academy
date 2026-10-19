import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';

test('internal views: atomic deduplication, expiry, allowlist and service-only writes', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(await readFile(new URL('../supabase/migrations/20261019000400_internal_pageviews.sql', import.meta.url), 'utf8'));
    const id = randomUUID();
    const record = (key = id, path = '/masterclass', at = new Date().toISOString()) => db.query('select record_internal_pageview($1,$2,$3)', [key, path, at]);
    await db.exec('set role service_role');
    await record(); await record();
    assert.equal(Number((await db.query('select sum(views) as n from internal_pageview_daily')).rows[0].n), 1);
    await record(randomUUID());
    assert.equal(Number((await db.query('select sum(views) as n from internal_pageview_daily')).rows[0].n), 2);
    await assert.rejects(record(randomUUID(), '/admin'), /Invalid view/);
    await assert.rejects(record(randomUUID(), '/masterclass', new Date(Date.now() - 90000000).toISOString()), /Invalid view/);
    await assert.rejects(record(randomUUID(), '/masterclass', new Date(Date.now() + 600000).toISOString()), /Invalid view/);
    await db.query('insert into internal_pageview_receipts values($1, now() - interval \'2 days\')', [randomUUID()]);
    await record();
    assert.equal((await db.query('select count(*)::int as n from internal_pageview_receipts')).rows[0].n, 2);
    for (const role of ['anon', 'authenticated']) {
      await db.exec('reset role; set role ' + role);
      await assert.rejects(record(), /permission denied/);
      await assert.rejects(db.query('select * from internal_pageview_daily'), /permission denied/);
      await assert.rejects(db.query('insert into internal_pageview_daily values(current_date,\'/masterclass\',1)'), /permission denied/);
    }
  } finally { await db.close(); }
});
