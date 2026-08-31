-- ============================================================================
-- 0019 — course_reads : marqueur de lecture aussi pour les résumés
-- ----------------------------------------------------------------------------
-- 0018 ne suivait que les questions (`seen_at`). On généralise :
--   * `seen_at` -> `questions_seen_at`
--   * nouvelle colonne `summaries_seen_at`
-- Un résumé est « nouveau » si `created_at > summaries_seen_at`, hors les
-- siens. Même principe que les questions (cf. ADR 0022).
--
-- Idempotent (renommage gardé ; `add column if not exists`).
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'course_reads' and column_name = 'seen_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'course_reads'
      and column_name = 'questions_seen_at'
  ) then
    alter table public.course_reads rename column seen_at to questions_seen_at;
  end if;
end $$;

alter table public.course_reads add column if not exists summaries_seen_at timestamptz;
