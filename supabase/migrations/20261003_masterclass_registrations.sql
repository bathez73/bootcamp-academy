create table if not exists public.masterclass_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  whatsapp text not null check (char_length(whatsapp) between 9 and 16),
  consent boolean not null default false check (consent),
  created_at timestamptz not null default now()
);

create unique index if not exists masterclass_registrations_email_unique
  on public.masterclass_registrations (lower(email));

create index if not exists masterclass_registrations_created_at_idx
  on public.masterclass_registrations (created_at desc);

alter table public.masterclass_registrations enable row level security;
revoke all on public.masterclass_registrations from anon, authenticated;
grant select, insert on public.masterclass_registrations to service_role;