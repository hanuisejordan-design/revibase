-- ============================================================================
-- 0011 — Renommage : groupe → classe, classe → cours
-- ----------------------------------------------------------------------------
-- Le vocabulaire change, pas la structure. Les 3 niveaux restent :
--
--   ancien « groupe »   ->  « classe »  (table groups        -> classes)
--   ancien « classe »   ->  « cours »   (table classes       -> courses)
--   « chapitre »        ->  inchangé
--
--   group_members  -> class_members      class_members -> course_members
--   <table>.class_id (chapters/questions/quizzes) -> course_id
--   classes.group_id -> courses.class_id     group_members.group_id -> class_members.class_id
--
-- Les `RENAME` sont des opérations de MÉTADONNÉE : aucune donnée n'est
-- réécrite. Les policies RLS et les triggers suivent automatiquement les
-- renommages (références par OID / numéro de colonne). Seuls les CORPS de
-- fonctions doivent être réécrits (texte re-parsé à l'exécution).
--
-- Idempotent : chaque renommage est gardé par « l'ancien existe ET le
-- nouveau n'existe pas ».
-- ============================================================================

-- ---- 1. Renommer les fonctions (ordre important : échanges de noms) -------

do $$
begin
  -- niveau « cours » (ex-« classe »)
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'is_class_member')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'is_course_member')
  then alter function public.is_class_member(uuid) rename to is_course_member; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'is_class_trainer')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'is_course_trainer')
  then alter function public.is_class_trainer(uuid) rename to is_course_trainer; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'question_class')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'question_course')
  then alter function public.question_class(uuid) rename to question_course; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'answer_class')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'answer_course')
  then alter function public.answer_class(uuid) rename to answer_course; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'quiz_class')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'quiz_course')
  then alter function public.quiz_class(uuid) rename to quiz_course; end if;

  -- niveau « classe » (ex-« groupe ») : les noms libérés ci-dessus
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'is_group_member')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'is_class_member')
  then alter function public.is_group_member(uuid) rename to is_class_member; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'is_group_admin')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'is_class_admin')
  then alter function public.is_group_admin(uuid) rename to is_class_admin; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'create_class')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'create_course')
  then alter function public.create_class(text, text[], uuid) rename to create_course; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'create_group')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'create_class')
  then alter function public.create_group(text) rename to create_class; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'join_class_by_code')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'join_course_by_code')
  then alter function public.join_class_by_code(text) rename to join_course_by_code; end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'join_group_by_code')
     and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'join_class_by_code')
  then alter function public.join_group_by_code(text) rename to join_class_by_code; end if;
end $$;

-- ---- 2. Renommer les tables (ordre : libérer les noms avant de les reprendre) --

do $$
begin
  if to_regclass('public.class_members') is not null
     and to_regclass('public.course_members') is null
  then alter table public.class_members rename to course_members; end if;

  if to_regclass('public.classes') is not null
     and to_regclass('public.courses') is null
  then alter table public.classes rename to courses; end if;

  if to_regclass('public.group_members') is not null
     and to_regclass('public.class_members') is null
  then alter table public.group_members rename to class_members; end if;

  if to_regclass('public.groups') is not null
     and to_regclass('public.classes') is null
  then alter table public.groups rename to classes; end if;
end $$;

-- ---- 3. Renommer les colonnes -------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('courses',        'group_id', 'class_id'),
      ('course_members', 'class_id', 'course_id'),
      ('class_members',  'group_id', 'class_id'),
      ('chapters',       'class_id', 'course_id'),
      ('questions',      'class_id', 'course_id'),
      ('quizzes',        'class_id', 'course_id')
    ) as t(tbl, oldc, newc)
  loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = r.tbl and column_name = r.oldc)
       and not exists (select 1 from information_schema.columns
                       where table_schema = 'public' and table_name = r.tbl and column_name = r.newc)
    then
      execute format('alter table public.%I rename column %I to %I', r.tbl, r.oldc, r.newc);
    end if;
  end loop;
end $$;

-- ---- 4. Réécrire les corps de fonctions (texte re-parsé à l'exécution) --

-- niveau « cours »
create or replace function public.is_course_member(target_course uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.course_members
    where course_id = target_course and user_id = auth.uid()
  ) or exists (
    select 1
    from public.courses c
    join public.class_members cm on cm.class_id = c.class_id
    where c.id = target_course and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_course_trainer(target_course uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.course_members
    where course_id = target_course and user_id = auth.uid() and role = 'trainer'
  );
$$;

create or replace function public.question_course(target_question uuid)
returns uuid language sql security definer set search_path = public stable
as $$
  select course_id from public.questions where id = target_question;
$$;

create or replace function public.answer_course(target_answer uuid)
returns uuid language sql security definer set search_path = public stable
as $$
  select public.question_course(a.question_id)
  from public.answers a where a.id = target_answer;
$$;

create or replace function public.quiz_course(target_quiz uuid)
returns uuid language sql security definer set search_path = public stable
as $$
  select course_id from public.quizzes where id = target_quiz;
$$;

-- niveau « classe »
create or replace function public.is_class_member(target_class uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.class_members
    where class_id = target_class and user_id = auth.uid()
  );
$$;

create or replace function public.is_class_admin(target_class uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.class_members
    where class_id = target_class and user_id = auth.uid() and is_admin
  );
$$;

-- validation d'une réponse : mêmes règles, noms mis à jour
create or replace function public.enforce_answer_validation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.validated_by is not null
     and (tg_op = 'INSERT' or new.validated_by is distinct from old.validated_by)
  then
    if auth.uid() is not null then
      if not public.is_course_trainer(public.question_course(new.question_id)) then
        raise exception 'Seul un formateur du cours peut valider une réponse';
      end if;
      new.validated_by := auth.uid();
    end if;
    new.validated_at := now();
  end if;

  if tg_op = 'UPDATE'
     and old.validated_by is not null
     and new.validated_by is null
     and auth.uid() is not null
     and not public.is_course_trainer(public.question_course(new.question_id))
  then
    raise exception 'Seul un formateur du cours peut retirer une validation';
  end if;

  if new.validated_by is null then
    new.validated_at := null;
  end if;

  return new;
end;
$$;

-- retenir UNE réponse : corps inchangé (ne référence que answers / questions),
-- on le recrée pour cohérence du message.
create or replace function public.accept_answer(p_answer uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_question uuid;
  v_accepted boolean;
  v_asker    uuid;
begin
  select a.question_id, a.accepted into v_question, v_accepted
  from public.answers a where a.id = p_answer;
  if v_question is null then raise exception 'Réponse introuvable'; end if;

  select q.author_id into v_asker from public.questions q where q.id = v_question;
  if v_asker is null or v_asker <> auth.uid() then
    raise exception 'Seul l''auteur de la question peut retenir une réponse';
  end if;

  if v_accepted then
    update public.answers set accepted = false where id = p_answer;
  else
    update public.answers set accepted = false where question_id = v_question;
    update public.answers set accepted = true where id = p_answer;
  end if;
end;
$$;

-- RPC : créer un cours (ex-create_class), avec rattachement optionnel à une classe
create or replace function public.create_course(
  p_name     text,
  p_chapters text[] default null,
  p_class_id uuid   default null
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

  insert into public.course_members (course_id, user_id, role)
  values (v_course_id, auth.uid(), 'trainer');

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

-- RPC : rejoindre un cours par code (ex-join_class_by_code)
create or replace function public.join_course_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_course_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select id into v_course_id from public.courses where join_code = upper(trim(p_code));
  if v_course_id is null then
    raise exception 'Code de cours invalide' using errcode = 'no_data_found';
  end if;

  insert into public.course_members (course_id, user_id, role)
  values (v_course_id, auth.uid(), 'student')
  on conflict (course_id, user_id) do nothing;

  return v_course_id;
end;
$$;

-- RPC : créer une classe (ex-create_group)
create or replace function public.create_class(p_name text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_class_id uuid;
  v_code     text;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Le nom de la classe est requis'; end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.classes (name, join_code, created_by)
  values (trim(p_name), v_code, auth.uid())
  returning id into v_class_id;

  insert into public.class_members (class_id, user_id, is_admin)
  values (v_class_id, auth.uid(), true);

  return v_class_id;
end;
$$;

-- RPC : rejoindre une classe par code (ex-join_group_by_code)
create or replace function public.join_class_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_class_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;

  select id into v_class_id from public.classes where join_code = upper(trim(p_code));
  if v_class_id is null then
    raise exception 'Code de classe invalide' using errcode = 'no_data_found';
  end if;

  insert into public.class_members (class_id, user_id, is_admin)
  values (v_class_id, auth.uid(), false)
  on conflict (class_id, user_id) do nothing;

  return v_class_id;
end;
$$;

-- ---- 5. Privilèges (les CREATE OR REPLACE conservent l'ACL ; on redonne
--         explicitement par sécurité, comme dans les migrations précédentes) --

grant execute on function public.is_course_member(uuid)              to authenticated, service_role;
grant execute on function public.is_course_trainer(uuid)             to authenticated, service_role;
grant execute on function public.question_course(uuid)               to authenticated, service_role;
grant execute on function public.answer_course(uuid)                 to authenticated, service_role;
grant execute on function public.quiz_course(uuid)                   to authenticated, service_role;
grant execute on function public.is_class_member(uuid)               to authenticated, service_role;
grant execute on function public.is_class_admin(uuid)                to authenticated, service_role;
grant execute on function public.create_course(text, text[], uuid)   to authenticated, service_role;
grant execute on function public.join_course_by_code(text)           to authenticated, service_role;
grant execute on function public.create_class(text)                  to authenticated, service_role;
grant execute on function public.join_class_by_code(text)            to authenticated, service_role;

-- Note : les policies RLS (chapters/questions/answers/… et storage.objects)
-- suivent les renommages toutes seules (références par OID / numéro de
-- colonne). Rien à recréer côté policies.
