-- ============================================================================
-- Revibase — schéma initial (MVP)
-- ----------------------------------------------------------------------------
-- Cible : PostgreSQL / Supabase (schéma `public`, auth via `auth.users`).
--
-- Application :
--   psql "$DATABASE_URL" -f supabase/migrations/0001_initial_schema.sql
--   ou : coller dans Supabase Studio → SQL Editor.
--
-- Principe de sécurité : la RLS est activée sur TOUTES les tables. Un
-- utilisateur ne voit que les données des classes dont il est membre.
-- Les fonctions d'aide sont `security definer` pour éviter la récursion RLS.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Fonctions génériques
-- ============================================================================

-- Met `updated_at` à jour à chaque UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- 2. Profils (1-1 avec auth.users)
-- ============================================================================

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Données publiques d''un utilisateur. Le rôle n''est pas ici mais sur class_members.';

-- Crée automatiquement le profil à l''inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. Classes et membres
-- ============================================================================

create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  join_code  text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.class_members (
  id        uuid primary key default gen_random_uuid(),
  class_id  uuid not null references public.classes (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'student' check (role in ('student', 'trainer')),
  joined_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create index class_members_user_idx on public.class_members (user_id);
create index class_members_class_idx on public.class_members (class_id);

-- Aides RLS : `security definer` => ne déclenchent pas la RLS de class_members
-- (sinon récursion infinie sur les policies de cette table).
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
  );
$$;

create or replace function public.is_class_trainer(target_class uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.class_members
    where class_id = target_class
      and user_id = auth.uid()
      and role = 'trainer'
  );
$$;

-- ============================================================================
-- 4. Chapitres
-- ============================================================================

create table public.chapters (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  position   int not null default 0,
  created_at timestamptz not null default now(),
  unique (class_id, name)
);

create index chapters_class_idx on public.chapters (class_id);

-- ============================================================================
-- 5. Questions
-- ============================================================================

create table public.questions (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  kind       text not null default 'open' check (kind in ('open', 'mcq')),
  title      text not null check (char_length(title) between 1 and 300),
  body       text check (body is null or char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index questions_class_created_idx on public.questions (class_id, created_at desc);
create index questions_chapter_idx on public.questions (chapter_id);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create or replace function public.question_class(target_question uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select class_id from public.questions where id = target_question;
$$;

-- Prévu pour les questions `mcq` (Phase 8). Non utilisé au MVP.
create table public.question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  is_correct  boolean not null default false,
  position    int not null default 0
);

create index question_options_question_idx on public.question_options (question_id);

-- ============================================================================
-- 6. Réponses et votes
-- ============================================================================

create table public.answers (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.questions (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 5000),
  accepted     boolean not null default false,          -- retenue par l''auteur de la question
  validated_by uuid references public.profiles (id) on delete set null, -- formateur
  validated_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index answers_question_idx on public.answers (question_id);

create trigger answers_set_updated_at
  before update on public.answers
  for each row execute function public.set_updated_at();

-- Garantit que seule une personne `trainer` de la classe peut valider une
-- réponse, et normalise `validated_at`. Règle métier appliquée EN BASE.
--
-- Deux contextes :
--   * utilisateur authentifié (JWT) : il DOIT être formateur de la classe,
--     et c'est lui qui est enregistré comme validateur (`validated_by`) ;
--   * contexte serveur / admin sans session (service_role, script SQL,
--     seed) : `auth.uid()` est NULL, on fait confiance à l'appelant et on
--     conserve la valeur fournie.
create or replace function public.enforce_answer_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Poser une validation (ou la changer) : réservé à un formateur.
  if new.validated_by is not null
     and (tg_op = 'INSERT' or new.validated_by is distinct from old.validated_by)
  then
    if auth.uid() is not null then
      if not public.is_class_trainer(public.question_class(new.question_id)) then
        raise exception 'Seul un formateur de la classe peut valider une réponse';
      end if;
      new.validated_by := auth.uid();
    end if;
    new.validated_at := now();
  end if;

  -- Retirer une validation existante : également réservé à un formateur.
  if tg_op = 'UPDATE'
     and old.validated_by is not null
     and new.validated_by is null
     and auth.uid() is not null
     and not public.is_class_trainer(public.question_class(new.question_id))
  then
    raise exception 'Seul un formateur de la classe peut retirer une validation';
  end if;

  if new.validated_by is null then
    new.validated_at := null;
  end if;

  return new;
end;
$$;

create trigger answers_enforce_validation
  before insert or update on public.answers
  for each row execute function public.enforce_answer_validation();

create table public.answer_votes (
  id         uuid primary key default gen_random_uuid(),
  answer_id  uuid not null references public.answers (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (answer_id, user_id)   -- 1 vote positif par personne, pas de valeur
);

create index answer_votes_answer_idx on public.answer_votes (answer_id);

create or replace function public.answer_class(target_answer uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select public.question_class(a.question_id)
  from public.answers a
  where a.id = target_answer;
$$;

-- Nombre de votes par réponse (respecte la RLS de l''appelant).
create view public.answer_vote_counts
with (security_invoker = on) as
  select answer_id, count(*)::int as vote_count
  from public.answer_votes
  group by answer_id;

-- ============================================================================
-- 7. Discussion (thread attaché à la question)
-- ============================================================================

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index comments_question_created_idx on public.comments (question_id, created_at);

-- ============================================================================
-- 8. Quiz
-- ============================================================================

create table public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references public.classes (id) on delete cascade,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  chapter_id      uuid references public.chapters (id) on delete set null, -- null = tous les chapitres
  requested_count int not null check (requested_count between 1 and 50),
  mode            text not null default 'self_assessment' check (mode in ('self_assessment', 'mcq')),
  created_at      timestamptz not null default now()
);

create table public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  position    int not null,
  unique (quiz_id, question_id)
);

create table public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  score        int,
  total        int,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id);

create table public.quiz_answers (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.quiz_attempts (id) on delete cascade,
  quiz_question_id   uuid not null references public.quiz_questions (id) on delete cascade,
  knew_it            boolean,                                              -- mode auto-évaluation
  selected_answer_id uuid references public.answers (id) on delete set null, -- mode mcq (futur)
  is_correct         boolean,
  unique (attempt_id, quiz_question_id)
);

create or replace function public.quiz_class(target_quiz uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select class_id from public.quizzes where id = target_quiz;
$$;

-- ============================================================================
-- 9. Notifications (socle — pas d''UI au MVP)
-- ============================================================================

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('answer', 'comment', 'validation', 'new_question')),
  question_id uuid references public.questions (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- ============================================================================
-- 10. RPC (opérations atomiques, appelées depuis les Server Actions)
-- ============================================================================

-- Crée une classe, ajoute le créateur comme formateur, sème les chapitres
-- par défaut. Renvoie l''id de la classe.
create or replace function public.create_class(p_name text, p_chapters text[] default null)
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

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.classes (name, join_code, created_by)
  values (trim(p_name), v_code, auth.uid())
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

-- Rejoint une classe à partir de son code. Renvoie l''id de la classe.
create or replace function public.join_class_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select id into v_class_id
  from public.classes
  where join_code = upper(trim(p_code));

  if v_class_id is null then
    raise exception 'Code de classe invalide' using errcode = 'no_data_found';
  end if;

  insert into public.class_members (class_id, user_id, role)
  values (v_class_id, auth.uid(), 'student')
  on conflict (class_id, user_id) do nothing;

  return v_class_id;
end;
$$;

-- Retient UNE réponse par question. Réservé à l'auteur de la question
-- (souvent la réponse est écrite par quelqu'un d'autre -> l'UPDATE direct
-- serait bloqué par la RLS `answers_update_author_or_trainer`).
create or replace function public.accept_answer(p_answer uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question uuid;
  v_accepted boolean;
  v_asker    uuid;
begin
  select a.question_id, a.accepted into v_question, v_accepted
  from public.answers a where a.id = p_answer;

  if v_question is null then
    raise exception 'Réponse introuvable';
  end if;

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

-- ============================================================================
-- 11. Row Level Security
-- ============================================================================

alter table public.profiles          enable row level security;
alter table public.classes           enable row level security;
alter table public.class_members     enable row level security;
alter table public.chapters          enable row level security;
alter table public.questions         enable row level security;
alter table public.question_options  enable row level security;
alter table public.answers           enable row level security;
alter table public.answer_votes      enable row level security;
alter table public.comments          enable row level security;
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.quiz_answers      enable row level security;
alter table public.notifications     enable row level security;

-- ---- profiles -------------------------------------------------------------
create policy "profiles_select_shared" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.class_members me
      join public.class_members them on them.class_id = me.class_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- classes ------------------------------------------------------------
create policy "classes_select_member" on public.classes
  for select using (public.is_class_member(id) or created_by = auth.uid());

create policy "classes_insert_self" on public.classes
  for insert with check (created_by = auth.uid());

create policy "classes_update_trainer" on public.classes
  for update using (public.is_class_trainer(id)) with check (public.is_class_trainer(id));

-- ---- class_members ----------------------------------------------------
create policy "members_select_in_my_classes" on public.class_members
  for select using (public.is_class_member(class_id));

create policy "members_join_self_student" on public.class_members
  for insert with check (user_id = auth.uid() and role = 'student');

create policy "members_creator_as_trainer" on public.class_members
  for insert with check (
    user_id = auth.uid()
    and role = 'trainer'
    and exists (
      select 1 from public.classes c
      where c.id = class_id and c.created_by = auth.uid()
    )
  );

create policy "members_delete_self_or_trainer" on public.class_members
  for delete using (user_id = auth.uid() or public.is_class_trainer(class_id));

-- ---- chapters --------------------------------------------------------
-- Vision communautaire : tout membre gère les chapitres. Le rôle formateur
-- reste réservé à la validation des réponses (cf. answers, notifications).
create policy "chapters_select_member" on public.chapters
  for select using (public.is_class_member(class_id));

create policy "chapters_insert_member" on public.chapters
  for insert with check (public.is_class_member(class_id));

create policy "chapters_update_member" on public.chapters
  for update using (public.is_class_member(class_id)) with check (public.is_class_member(class_id));

create policy "chapters_delete_member" on public.chapters
  for delete using (public.is_class_member(class_id));

-- ---- questions -----------------------------------------------------
-- La RLS ne gère que l'autorisation (la classe). Le masquage des questions
-- supprimées (`deleted_at`) est fait par l'application : mettre `deleted_at`
-- dans cette policy casserait l'UPDATE de suppression douce.
create policy "questions_select_member" on public.questions
  for select using (public.is_class_member(class_id));

create policy "questions_insert_member" on public.questions
  for insert with check (public.is_class_member(class_id) and author_id = auth.uid());

create policy "questions_update_author_or_trainer" on public.questions
  for update using (author_id = auth.uid() or public.is_class_trainer(class_id))
  with check (author_id = auth.uid() or public.is_class_trainer(class_id));

create policy "questions_delete_author_or_trainer" on public.questions
  for delete using (author_id = auth.uid() or public.is_class_trainer(class_id));

-- ---- question_options (Phase 8) -----------------------------------
create policy "question_options_select_member" on public.question_options
  for select using (public.is_class_member(public.question_class(question_id)));

create policy "question_options_write_trainer" on public.question_options
  for all
  using (public.is_class_trainer(public.question_class(question_id)))
  with check (public.is_class_trainer(public.question_class(question_id)));

-- ---- answers ------------------------------------------------------
create policy "answers_select_member" on public.answers
  for select using (public.is_class_member(public.question_class(question_id)));

create policy "answers_insert_member" on public.answers
  for insert with check (
    public.is_class_member(public.question_class(question_id))
    and author_id = auth.uid()
  );

create policy "answers_update_author_or_trainer" on public.answers
  for update using (
    author_id = auth.uid()
    or public.is_class_trainer(public.question_class(question_id))
  )
  with check (
    author_id = auth.uid()
    or public.is_class_trainer(public.question_class(question_id))
  );

create policy "answers_delete_author_or_trainer" on public.answers
  for delete using (
    author_id = auth.uid()
    or public.is_class_trainer(public.question_class(question_id))
  );

-- ---- answer_votes -----------------------------------------------
create policy "votes_select_member" on public.answer_votes
  for select using (public.is_class_member(public.answer_class(answer_id)));

create policy "votes_insert_self" on public.answer_votes
  for insert with check (
    user_id = auth.uid()
    and public.is_class_member(public.answer_class(answer_id))
  );

create policy "votes_delete_self" on public.answer_votes
  for delete using (user_id = auth.uid());

-- ---- comments --------------------------------------------------
create policy "comments_select_member" on public.comments
  for select using (public.is_class_member(public.question_class(question_id)));

create policy "comments_insert_member" on public.comments
  for insert with check (
    public.is_class_member(public.question_class(question_id))
    and author_id = auth.uid()
  );

create policy "comments_update_author" on public.comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "comments_delete_author_or_trainer" on public.comments
  for delete using (
    author_id = auth.uid()
    or public.is_class_trainer(public.question_class(question_id))
  );

-- ---- quizzes --------------------------------------------------
create policy "quizzes_select_member" on public.quizzes
  for select using (public.is_class_member(class_id));

create policy "quizzes_insert_member" on public.quizzes
  for insert with check (public.is_class_member(class_id) and created_by = auth.uid());

create policy "quiz_questions_select_member" on public.quiz_questions
  for select using (public.is_class_member(public.quiz_class(quiz_id)));

create policy "quiz_questions_insert_owner" on public.quiz_questions
  for insert with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.created_by = auth.uid()
    )
  );

-- ---- quiz_attempts / quiz_answers : chacun ne voit que les siens ----
create policy "attempts_rw_self" on public.quiz_attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "quiz_answers_rw_self" on public.quiz_answers
  for all
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

-- ---- notifications : lecture / marquage lu de ses propres notifs ----
create policy "notifications_select_self" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_self" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Aucune policy INSERT sur notifications : l''écriture se fait via le rôle
-- `service_role` (serveur) ou de futurs triggers `security definer`.

-- ============================================================================
-- 12. Privilèges des rôles API
-- ----------------------------------------------------------------------------
-- Certains projets Supabase n''accordent PAS automatiquement les privilèges
-- aux rôles `anon` / `authenticated` / `service_role` sur les tables créées
-- via l''éditeur SQL (=> "permission denied for table ...").
--
-- Ces GRANT ouvrent l''accès AU NIVEAU TABLE ; la RLS reste le filtre fin,
-- ligne par ligne. `anon` (non connecté) ne reçoit rien : aucune de nos
-- policies ne l''autorise, donc il ne voit rien même avec un GRANT.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- authenticated : CRUD sur toutes les tables (filtré ensuite par la RLS)
grant select, insert, update, delete on all tables in schema public to authenticated;

-- service_role : tout (contourne la RLS — usage serveur / admin uniquement)
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

-- Fonctions : requis pour les RPC ET pour les fonctions appelées dans la RLS
grant execute on all functions in schema public to authenticated, service_role;

-- Objets créés plus tard (prochaines migrations) : mêmes privilèges par défaut
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to authenticated, service_role;
