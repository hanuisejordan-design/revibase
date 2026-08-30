-- ============================================================================
-- 0014 — Rôles d'un cours : séparer « admin » et « formateur »
-- ----------------------------------------------------------------------------
-- Deux choses INDÉPENDANTES sur course_members :
--   * is_admin (booléen) : gestion du cours (code d'invitation, membres,
--     attribution des rôles). Le créateur l'a ; un admin peut en nommer.
--   * role ('student' | 'trainer') : purement pédagogique. « trainer »
--     (formateur) valide les réponses ; il est ATTRIBUÉ par un admin.
--
-- Arrivée dans un cours = `is_admin = false, role = 'student'` (élève).
-- Idempotent.
-- ============================================================================

alter table public.course_members
  add column if not exists is_admin boolean not null default false;

-- Backfill : les « trainer » actuels sont les créateurs -> ils gardent la
-- gestion. On ne touche pas à leur `role` (ils valident déjà).
update public.course_members
set is_admin = true
where role = 'trainer' and is_admin = false;

-- Aide RLS.
create or replace function public.is_course_admin(target_course uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.course_members
    where course_id = target_course and user_id = auth.uid() and is_admin
  );
$$;

grant execute on function public.is_course_admin(uuid) to authenticated, service_role;

-- Un admin du cours peut modifier les lignes course_members (is_admin / role).
drop policy if exists "course_members_update_admin" on public.course_members;
create policy "course_members_update_admin" on public.course_members
  for update
  using (public.is_course_admin(course_id))
  with check (public.is_course_admin(course_id));

-- Désormais, créer un cours = en être ADMIN. Le rôle « formateur » est
-- optionnel à la création (`p_is_trainer`) : coché uniquement par un vrai
-- enseignant. Nouveau paramètre => on supprime l'ancienne signature.
drop function if exists public.create_course(text, text[], uuid);
create function public.create_course(
  p_name       text,
  p_chapters   text[] default null,
  p_class_id   uuid   default null,
  p_is_trainer boolean default false
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_course_id uuid;
  v_code      text;
  v_chapter   text;
  v_pos       int := 0;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Le nom du cours est requis'; end if;
  if p_class_id is not null and not public.is_class_admin(p_class_id) then
    raise exception 'Seul un administrateur de la classe peut y ajouter un cours';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.courses (name, join_code, created_by, class_id)
  values (trim(p_name), v_code, auth.uid(), p_class_id)
  returning id into v_course_id;

  insert into public.course_members (course_id, user_id, is_admin, role)
  values (v_course_id, auth.uid(), true, case when p_is_trainer then 'trainer' else 'student' end);

  foreach v_chapter in array coalesce(
    p_chapters,
    array['Signalisation', 'Réglementation', 'Matériel', 'Sécurité']
  )
  loop
    insert into public.chapters (course_id, name, position)
    values (v_course_id, v_chapter, v_pos)
    on conflict (course_id, name) do nothing;
    v_pos := v_pos + 1;
  end loop;

  return v_course_id;
end;
$$;

grant execute on function public.create_course(text, text[], uuid, boolean)
  to authenticated, service_role;
