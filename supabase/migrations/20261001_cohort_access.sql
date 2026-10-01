alter table public.profiles
  add column if not exists cohort_paid boolean not null default false,
  add column if not exists course_access_granted_at timestamptz,
  add column if not exists cohort_total_paid numeric not null default 0,
  add column if not exists cohort_access_approved boolean not null default false,
  add column if not exists cohort_access_approved_at timestamptz;

create index if not exists profiles_cohort_paid_idx on public.profiles (cohort_paid);