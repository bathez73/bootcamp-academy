-- ============================================================
-- Novenetech Campus — Migration Supabase
-- À exécuter dans Supabase > SQL Editor (ou via `supabase db push`).
-- Active RLS : chaque utilisateur ne voit que ses propres données.
-- ============================================================

create extension if not exists pgcrypto;

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