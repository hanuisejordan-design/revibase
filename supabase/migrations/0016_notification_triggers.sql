-- ============================================================================
-- 0016 — Écriture des notifications (triggers)
-- ----------------------------------------------------------------------------
-- La table `notifications` existe depuis 0001 mais rien ne l'alimente. On
-- ajoute 3 triggers `security definer` (contournent l'absence de policy INSERT
-- sur `notifications` — voulu) :
--
--   * réponse ajoutée      -> notifie l'auteur de la question
--   * commentaire ajouté   -> notifie l'auteur de la question
--   * réponse validée      -> notifie l'auteur de la réponse
--
-- Le broadcast « nouvelle question » n'est PAS géré ici (ce sera le badge
-- `course_reads`, cf. backlog).
--
-- Idempotent.
-- ============================================================================

create or replace function public.notify_on_answer()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.questions where id = new.question_id;
  if v_author is not null and v_author <> new.author_id then
    insert into public.notifications (user_id, type, question_id, actor_id)
    values (v_author, 'answer', new.question_id, new.author_id);
  end if;
  return new;
end;
$$;

drop trigger if exists answers_notify on public.answers;
create trigger answers_notify
  after insert on public.answers
  for each row execute function public.notify_on_answer();

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.questions where id = new.question_id;
  if v_author is not null and v_author <> new.author_id then
    insert into public.notifications (user_id, type, question_id, actor_id)
    values (v_author, 'comment', new.question_id, new.author_id);
  end if;
  return new;
end;
$$;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

create or replace function public.notify_on_validation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.validated_by is not null
     and old.validated_by is distinct from new.validated_by
     and new.author_id <> new.validated_by
  then
    insert into public.notifications (user_id, type, question_id, actor_id)
    values (new.author_id, 'validation', new.question_id, new.validated_by);
  end if;
  return new;
end;
$$;

drop trigger if exists answers_notify_validation on public.answers;
create trigger answers_notify_validation
  after update on public.answers
  for each row execute function public.notify_on_validation();
