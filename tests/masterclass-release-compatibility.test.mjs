import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('additive release migrations preserve registrations and permit application rollback', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    const apply = async name => db.exec(await readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8'));
    for (const name of ['20261003_masterclass_registrations.sql', '20261006_masterclass_utm_attribution.sql', '20261007_masterclass_consent.sql']) await apply(name);
    const insertOld = email => db.query("insert into masterclass_registrations(full_name,email,whatsapp,consent) values('Fixture',$1,'+2290190000000',true) returning id", [email]);
    const previous = (await insertOld('before@example.test')).rows[0].id;
    for (const name of ['20261019000300_masterclass_meta_event.sql', '20261019000400_internal_pageviews.sql']) await apply(name);
    assert.equal((await db.query('select id from masterclass_registrations where email=$1', ['before@example.test'])).rows[0].id, previous);
    // Previous application's INSERT still works with the additive schema.
    await insertOld('after-rollback@example.test');
    assert.equal((await db.query('select count(*)::int as n from masterclass_registrations')).rows[0].n, 2);
    assert.equal((await db.query('select count(*)::int as n from masterclass_registrations where meta_event_id is not null')).rows[0].n, 2);
    await assert.rejects(insertOld('BEFORE@example.test'), /unique constraint/);
  } finally { await db.close(); }
});
