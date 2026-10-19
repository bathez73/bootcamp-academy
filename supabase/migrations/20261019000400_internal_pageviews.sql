begin;
create table public.internal_pageview_receipts (
  id uuid primary key,
  occurred_at timestamptz not null
);
create index internal_pageview_receipts_expiry on public.internal_pageview_receipts(occurred_at);
create table public.internal_pageview_daily (
  day date not null,
  path text not null check (path in ('/', '/masterclass', '/academy', '/bootcamp', '/inscription', '/programme')),
  views bigint not null default 0 check (views >= 0),
  primary key(day, path)
);
alter table public.internal_pageview_receipts enable row level security;
alter table public.internal_pageview_daily enable row level security;
revoke all on public.internal_pageview_receipts, public.internal_pageview_daily from public, anon, authenticated;
grant select, insert, update, delete on public.internal_pageview_receipts, public.internal_pageview_daily to service_role;
create function public.record_internal_pageview(view_id uuid, view_path text, view_at timestamptz)
returns void language plpgsql security invoker set search_path = pg_catalog, public as $$
declare inserted integer;
begin
  if view_id is null or view_path is null or view_at is null or
    view_path not in ('/', '/masterclass', '/academy', '/bootcamp', '/inscription', '/programme') or
    view_at < now() - interval '24 hours' or view_at > now() + interval '5 minutes' then
    raise exception 'Invalid view';
  end if;
  delete from public.internal_pageview_receipts where occurred_at < now() - interval '24 hours';
  delete from public.internal_pageview_daily where day < current_date - 400;
  insert into public.internal_pageview_receipts(id, occurred_at) values(view_id, view_at) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 1 then
    insert into public.internal_pageview_daily(day, path, views)
      values((view_at at time zone 'Africa/Porto-Novo')::date, view_path, 1)
      on conflict(day,path) do update set views = public.internal_pageview_daily.views + 1;
  end if;
end;
$$;
revoke all on function public.record_internal_pageview(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.record_internal_pageview(uuid,text,timestamptz) to service_role;
commit;
