-- ============================================================================
-- Revibase — types de question : ouverte / vrai-faux / QCM
-- ----------------------------------------------------------------------------
-- - `questions.kind` accepte désormais 'true_false' en plus de 'open' / 'mcq'
-- - `question_options` (déjà créée en 0001) devient gérable par tout membre
--   de la classe, comme les chapitres (ADR 0007)
-- - `quiz_answers.selected_option_id` : l'option choisie pendant un quiz
--
-- À exécuter dans le SQL Editor. Ré-exécutable (idempotent).
-- ============================================================================

-- 1. Nouveau type de question --------------------------------------------------
alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions
  add constraint questions_kind_check check (kind in ('open', 'true_false', 'mcq'));

-- 2. question_options : gestion par tout membre ------------------------------
drop policy if exists "question_options_write_trainer" on public.question_options;
drop policy if exists "question_options_insert_member" on public.question_options;
drop policy if exists "question_options_update_member" on public.question_options;
drop policy if exists "question_options_delete_member" on public.question_options;

create policy "question_options_insert_member" on public.question_options
  for insert with check (public.is_class_member(public.question_class(question_id)));

create policy "question_options_update_member" on public.question_options
  for update using (public.is_class_member(public.question_class(question_id)))
  with check (public.is_class_member(public.question_class(question_id)));

create policy "question_options_delete_member" on public.question_options
  for delete using (public.is_class_member(public.question_class(question_id)));

-- 3. Quiz : option choisie --------------------------------------------------
alter table public.quiz_answers
  add column if not exists selected_option_id uuid
  references public.question_options (id) on delete set null;
