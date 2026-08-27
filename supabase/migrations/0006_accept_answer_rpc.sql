-- ============================================================================
-- Revibase — RPC : retenir une réponse (« réponse correcte » selon l'auteur)
-- ----------------------------------------------------------------------------
-- L'auteur d'une question marque UNE réponse comme retenue. Comme cette
-- réponse est souvent écrite par quelqu'un d'autre, la RLS
-- `answers_update_author_or_trainer` empêche l'UPDATE direct. Ce RPC
-- `security definer` vérifie que l'appelant est bien l'auteur de la question,
-- puis bascule le drapeau `accepted` (une seule réponse retenue par question).
--
-- Ré-exécutable (create or replace). Idempotent.
-- ============================================================================

create or replace function public.accept_answer(p_answer uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question   uuid;
  v_accepted   boolean;
  v_asker      uuid;
begin
  select a.question_id, a.accepted
    into v_question, v_accepted
  from public.answers a
  where a.id = p_answer;

  if v_question is null then
    raise exception 'Réponse introuvable';
  end if;

  select q.author_id into v_asker
  from public.questions q
  where q.id = v_question;

  if v_asker is null or v_asker <> auth.uid() then
    raise exception 'Seul l''auteur de la question peut retenir une réponse';
  end if;

  if v_accepted then
    -- déjà retenue -> on la « dé-retient »
    update public.answers set accepted = false where id = p_answer;
  else
    -- une seule réponse retenue par question
    update public.answers set accepted = false where question_id = v_question;
    update public.answers set accepted = true where id = p_answer;
  end if;
end;
$$;

grant execute on function public.accept_answer(uuid) to authenticated;
