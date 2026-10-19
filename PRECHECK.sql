-- Lecture seule ; aucune donnée personnelle ou valeur de secret.
begin read only;
select to_regclass('public.masterclass_registrations') as registrations;
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'masterclass_registrations'
order by ordinal_position;
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename = 'masterclass_registrations';
select rolname, rolbypassrls from pg_roles where rolname in ('anon','authenticated','service_role');
select has_column_privilege('authenticated','public.profiles','is_admin','UPDATE') as sensitive_admin_update,
       has_column_privilege('authenticated','public.profiles','cohort_access_approved','UPDATE') as sensitive_access_update;
rollback;
