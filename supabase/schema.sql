-- ============================================================
-- Novenetech Campus — Migration Supabase
-- À exécuter dans Supabase > SQL Editor (ou via `supabase db push`).
-- Active RLS : chaque utilisateur ne voit que ses propres données.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Profils / rôles ----------
-- is_admin = true par défaut pour personne. Pour donner l'accès admin au 1er
-- compte, exécuter une fois connecté : 
--   update public.profiles set is_admin = true where id = '<uuid>'
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crée automatiquement le profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
-- Un utilisateur peut modifier son profil mais pas s'auto-promouvoir admin
-- (la promotion admin se fait en SQL avec la clé service role).
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = false);

-- ---------- Paiements (écrits par le webhook avec la clé service role) ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  formation text not null,
  email text not null,
  amount numeric not null,
  status text not null default 'pending', -- pending | succes | email_echo
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Personne ne doit lire/écrire directement la table payments depuis le client.
create policy "payments select admin only" on public.payments for select using (auth.role() = 'service_role');
create policy "payments insert admin only" on public.payments for insert with check (auth.role() = 'service_role');
create policy "payments update admin only" on public.payments for update using (auth.role() = 'service_role');

-- ---------- Prospects CRM (par étudiant) ----------
create table if not exists public.crm_prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entreprise text not null,
  contact text not null default '',
  statut text not null default 'À contacter',
  created_at timestamptz not null default now()
);

-- Index pour retrouver les prospects d'un utilisateur.
create index if not exists crm_prospects_user_idx on public.crm_prospects (user_id);

alter table public.crm_prospects enable row level security;

create policy "crm own select" on public.crm_prospects for select using (auth.uid() = user_id);
create policy "crm own insert" on public.crm_prospects for insert with check (auth.uid() = user_id);
create policy "crm own update" on public.crm_prospects for update using (auth.uid() = user_id);
create policy "crm own delete" on public.crm_prospects for delete using (auth.uid() = user_id);

-- ---------- Progression du challenge 28 jours (par étudiant) ----------
create table if not exists public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  day integer not null check (day between 1 and 28),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.progress enable row level security;

create policy "progress own select" on public.progress for select using (auth.uid() = user_id);
create policy "progress own upsert" on public.progress for insert with check (auth.uid() = user_id);
create policy "progress own update" on public.progress for update using (auth.uid() = user_id);
create policy "progress own delete" on public.progress for delete using (auth.uid() = user_id);