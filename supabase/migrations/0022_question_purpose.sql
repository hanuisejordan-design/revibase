-- ============================================================================
-- 0022 — Intention d'une question : « besoin d'aide » ou « défi »
-- ----------------------------------------------------------------------------
-- `purpose` distingue une question posée par blocage (`help`, défaut) d'une
-- question posée pour entraîner les autres / nourrir les quiz (`challenge`).
-- Modifiable après coup (contrairement à `kind`). Aucun impact sur le
-- générateur de quiz pour l'instant.
--
-- Idempotent.
-- ============================================================================

alter table public.questions
  add column if not exists purpose text not null default 'help';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'questions_purpose_check' and conrelid = 'public.questions'::regclass
  ) then
    alter table public.questions
      add constraint questions_purpose_check check (purpose in ('help', 'challenge'));
  end if;
end $$;
