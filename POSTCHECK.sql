-- Lecture seule après les deux migrations approuvées.
begin read only;
select count(*) as registrations,
       count(meta_event_id) as registrations_with_event_id,
       count(distinct meta_event_id) as unique_event_ids
from public.masterclass_registrations;
select has_table_privilege('anon','public.internal_pageview_daily','SELECT') as anonymous_read_must_be_false,
       has_table_privilege('authenticated','public.internal_pageview_daily','INSERT') as browser_write_must_be_false,
       has_function_privilege('anon','public.record_internal_pageview(uuid,text,timestamptz)','EXECUTE') as anonymous_rpc_must_be_false,
       has_function_privilege('service_role','public.record_internal_pageview(uuid,text,timestamptz)','EXECUTE') as server_rpc_must_be_true;
select relname, relrowsecurity from pg_class
where oid in ('public.internal_pageview_daily'::regclass,'public.internal_pageview_receipts'::regclass);
rollback;
