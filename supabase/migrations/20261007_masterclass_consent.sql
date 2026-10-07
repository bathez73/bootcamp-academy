alter table public.masterclass_registrations
  add column if not exists event_consent boolean not null default true;

alter table public.masterclass_registrations
  add column if not exists marketing_consent boolean not null default false;

create index if not exists masterclass_registrations_event_consent_idx
  on public.masterclass_registrations (event_consent);

create index if not exists masterclass_registrations_marketing_consent_idx
  on public.masterclass_registrations (marketing_consent);
