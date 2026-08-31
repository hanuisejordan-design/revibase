-- ============================================================================
-- 0017 — Notification « nouvelle question dans le cours »
-- ----------------------------------------------------------------------------
-- Complète 0016. À chaque question posée, on notifie tous les AUTRES membres
-- du cours :
--   * membres directs        -> public.course_members (course_id)
--   * membres via la classe   -> public.class_members (courses.class_id)
-- dédoublonnés (UNION), l'auteur exclu. Type 'new_question' (déjà autorisé
-- par la contrainte CHECK de `notifications` depuis 0001).
--
-- Trigger `security definer` (comme 0016) : contourne l'absence voulue de
-- policy INSERT sur `notifications`.
--
-- Idempotent.
-- ============================================================================

create or replace function public.notify_on_new_question()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, question_id, actor_id)
  select m.user_id, 'new_question', new.id, new.author_id
  from (
    select user_id
    from public.course_members
    where course_id = new.course_id
    union
    select cm.user_id
    from public.courses c
    join public.class_members cm on cm.class_id = c.class_id
    where c.id = new.course_id
  ) m
  where m.user_id <> new.author_id;
  return new;
end;
$$;

drop trigger if exists questions_notify_new on public.questions;
create trigger questions_notify_new
  after insert on public.questions
  for each row execute function public.notify_on_new_question();
