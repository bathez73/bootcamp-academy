begin;
alter table public.masterclass_registrations
  add column if not exists meta_event_id uuid not null default gen_random_uuid(),
  add column if not exists advertising_consent boolean not null default false,
  add column if not exists advertising_consent_version text,
  add column if not exists advertising_consent_recorded_at timestamptz;
create unique index if not exists masterclass_meta_event_id_unique on public.masterclass_registrations(meta_event_id);
-- Opaque identity for one actual registration; no historic conversion is sent.
-- No Meta token, address hash or advertising identifier is stored here.
commit;
