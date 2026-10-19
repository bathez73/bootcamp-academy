import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('confirmed registrations have unique event IDs and count without advertising consent', async () => {
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role;');
    for(const name of ['20261003_masterclass_registrations.sql','20261007_masterclass_consent.sql','20261019000300_masterclass_meta_event.sql']) await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
    const insert = async (email, permission) => (await db.query('insert into masterclass_registrations(full_name,email,whatsapp,consent,advertising_consent) values($1,$2,$3,true,$4) returning meta_event_id',['Fixture',email,'+2290190000000',permission])).rows[0].meta_event_id;
    const a=await insert('one@example.test',false),b=await insert('two@example.test',true);
    assert.notEqual(a,b); assert.match(a,/^[0-9a-f-]{36}$/);
    await assert.rejects(insert('ONE@example.test',false),/unique constraint/);
    assert.equal((await db.query('select count(*)::int as n from masterclass_registrations')).rows[0].n,2);
    await db.exec('set role anon;');
    await assert.rejects(db.query('select * from masterclass_registrations'),/permission denied/);
  }finally{await db.close();}
});
