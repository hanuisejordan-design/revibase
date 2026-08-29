-- ============================================================================
-- 0009 — Groupes : une couche AU-DESSUS des classes
-- ----------------------------------------------------------------------------
-- Un `groupe` rassemble plusieurs classes (centre de formation, promo
-- pluri-matières…). Rejoindre le groupe avec son code = accès à TOUTES ses
-- classes, sans ligne `class_members`. Une classe sans groupe
-- (`group_id is null`) se comporte exactement comme avant : l'ajout est
-- purement additif.
--
-- Idempotent : `create table if not exists`, `drop policy if exists`,
-- `create or replace function`.
-- ============================================================================

-- ---- 1. Tables -------------------------------------------------------------

create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  join_code  text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  is_admin  boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);

alter table public.classes
  add column if not exists group_id uuid references public.groups (id) on delete set null;

create index if not exists classes_group_idx on public.classes (group_id);

-- ---- 2. Aides RLS (security definer -> pas de récursion) ------------------

create or replace function public.is_group_member(target_group uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_group uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group and user_id = auth.uid() and is_admin
  );
$$;

-- Étend l'appartenance à une classe : ligne `class_members` OU membre du
-- groupe propriétaire de la classe. `security definer` => pas de récursion
-- RLS sur `classes` / `group_members`.
create or replace function public.is_class_member(target_class uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.class_members
    where class_id = target_class and user_id = auth.uid()
  ) or exists (
    select 1
    from public.classes c
    join public.group_members gm on gm.group_id = c.group_id
    where c.id = target_class and gm.user_id = auth.uid()
  );
$$;

-- ---- 3. RLS -------------------------------------------------------------

alter table public.groups        enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member" on public.groups
  for select using (public.is_group_member(id) or created_by = auth.uid());

drop policy if exists "groups_insert_self" on public.groups;
create policy "groups_insert_self" on public.groups
  for insert with check (created_by = auth.uid());

drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_update_admin" on public.groups
  for update using (public.is_group_admin(id)) with check (public.is_group_admin(id));

drop policy if exists "group_members_select_in_my_groups" on public.group_members;
create policy "group_members_select_in_my_groups" on public.group_members
  for select using (public.is_group_member(group_id));

drop policy if exists "group_members_join_self" on public.group_members;
create policy "group_members_join_self" on public.group_members
  for insert with check (user_id = auth.uid() and is_admin = false);

drop policy if exists "group_members_delete_self_or_admin" on public.group_members;
create policy "group_members_delete_self_or_admin" on public.group_members
  for delete using (user_id = auth.uid() or public.is_group_admin(group_id));

-- Les membres d'un même groupe peuvent voir leurs profils (comme pour une
-- classe partagée). On réécrit la policy 0001 en ajoutant la branche groupe.
drop policy if exists "profiles_select_shared" on public.profiles;
create policy "profiles_select_shared" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.class_members me
      join public.class_members them on them.class_id = me.class_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
    or exists (
      select 1
      from public.group_members me
      join public.group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

-- ---- 4. RPC ----------------------------------------------------------

-- Crée un groupe, ajoute le créateur comme admin. Renvoie l'id du groupe.
create or replace function public.create_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_code     text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Le nom du groupe est requis';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.groups (name, join_code, created_by)
  values (trim(p_name), v_code, auth.uid())
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, is_admin)
  values (v_group_id, auth.uid(), true);

  return v_group_id;
end;
$$;

-- Rejoint un groupe à partir de son code. Renvoie l'id du groupe.
create or replace function public.join_group_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select id into v_group_id
  from public.groups
  where join_code = upper(trim(p_code));

  if v_group_id is null then
    raise exception 'Code de groupe invalide' using errcode = 'no_data_found';
  end if;

  insert into public.group_members (group_id, user_id, is_admin)
  values (v_group_id, auth.uid(), false)
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- `create_class` gagne un `p_group_id` optionnel : signature modifiée, donc
-- on supprime l'ancienne version avant de recréer.
drop function if exists public.create_class(text, text[]);
create or replace function public.create_class(
  p_name     text,
  p_chapters text[] default null,
  p_group_id uuid   default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_code     text;
  v_chapter  text;
  v_pos      int := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Le nom de la classe est requis';
  end if;
  if p_group_id is not null and not public.is_group_admin(p_group_id) then
    raise exception 'Seul un administrateur du groupe peut y ajouter une classe';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.classes (name, join_code, created_by, group_id)
  values (trim(p_name), v_code, auth.uid(), p_group_id)
  returning id into v_class_id;

  insert into public.class_members (class_id, user_id, role)
  values (v_class_id, auth.uid(), 'trainer');

  foreach v_chapter in array coalesce(
    p_chapters,
    array['Signalisation', 'Réglementation', 'Matériel', 'Sécurité']
  )
  loop
    insert into public.chapters (class_id, name, position)
    values (v_class_id, v_chapter, v_pos)
    on conflict (class_id, name) do nothing;
    v_pos := v_pos + 1;
  end loop;

  return v_class_id;
end;
$$;

-- ---- 5. Privilèges (tables créées via l'éditeur SQL : aucun GRANT auto) --

grant select, insert, update, delete on public.groups        to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant all on public.groups        to service_role;
grant all on public.group_members to service_role;

grant execute on function public.create_group(text)              to authenticated, service_role;
grant execute on function public.join_group_by_code(text)         to authenticated, service_role;
grant execute on function public.is_group_member(uuid)            to authenticated, service_role;
grant execute on function public.is_group_admin(uuid)             to authenticated, service_role;
grant execute on function public.create_class(text, text[], uuid) to authenticated, service_role;
