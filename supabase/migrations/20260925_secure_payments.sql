-- Exécuter après schema.sql, avant de publier cette version.
begin;
alter table public.payments add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.payments add column if not exists verified boolean not null default false;
create index if not exists payments_user_formation_idx on public.payments(user_id, formation) where verified = true;
-- Les anciens achats doivent être rapprochés manuellement : vérifier la transaction
-- chez Kkiapay, identifier le compte acheteur, puis renseigner user_id et verified.
-- Ne pas attribuer automatiquement un achat sur la seule base d'un email.
commit;
