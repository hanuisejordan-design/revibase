-- ============================================================================
-- 0015 — Chapitres par défaut : « Chapitre 1..4 » plutôt que des noms métier
-- ----------------------------------------------------------------------------
-- Un cours neuf reçoit toujours 4 chapitres, mais nommés de façon neutre
-- (« Chapitre 1 » … « Chapitre 4 ») — l'auteur les renomme ensuite selon sa
-- matière. Seule la liste par défaut change ; même signature qu'en 0014.
-- Idempotent.
-- ============================================================================

create or replace function public.create_course(
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
    array['Chapitre 1', 'Chapitre 2', 'Chapitre 3', 'Chapitre 4']
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
