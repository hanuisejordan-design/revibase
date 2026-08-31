-- ============================================================================
-- 0020 — Abonnements Web Push (notifications PWA)
-- ----------------------------------------------------------------------------
-- Un appareil = une ligne (clé `endpoint`). Strictement privé : chacun ne
-- gère que ses propres abonnements.
--
-- L'ENVOI d'un push se fait depuis une Server Action (Node, lib `web-push`)
-- qui doit lire les abonnements de DESTINATAIRES (donc d'autres utilisateurs).
-- Deux fonctions `security definer` couvrent ce besoin sans exposer la table :
--   * list_push_targets(uuid[])            -> endpoint + clés des destinataires
--   * delete_push_subscription_by_endpoint -> purge d'un abonnement périmé (410)
--
-- Idempotent.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_select_self'
  ) then
    create policy "push_subscriptions_select_self" on public.push_subscriptions
      for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_insert_self'
  ) then
    create policy "push_subscriptions_insert_self" on public.push_subscriptions
      for insert with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_update_self'
  ) then
    create policy "push_subscriptions_update_self" on public.push_subscriptions
      for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_delete_self'
  ) then
    create policy "push_subscriptions_delete_self" on public.push_subscriptions
      for delete using (user_id = auth.uid());
  end if;
end $$;

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

-- ----------------------------------------------------------------------------
-- Cibles d'un envoi : abonnements des utilisateurs passés en paramètre.
-- `security definer` : appelée par n'importe quel membre authentifié pour
-- notifier l'auteur d'une question / les membres d'un cours. Ne renvoie que
-- endpoint + clés (inutilisables sans la clé privée VAPID du serveur).
-- ----------------------------------------------------------------------------
create or replace function public.list_push_targets(p_user_ids uuid[])
returns table (endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
stable
as $$
  select s.endpoint, s.p256dh, s.auth
  from public.push_subscriptions s
  where s.user_id = any(p_user_ids);
$$;

-- Purge d'un abonnement périmé (le service de push a répondu 404/410).
create or replace function public.delete_push_subscription_by_endpoint(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

grant execute on function public.list_push_targets(uuid[]) to authenticated, service_role;
grant execute on function public.delete_push_subscription_by_endpoint(text)
  to authenticated, service_role;
