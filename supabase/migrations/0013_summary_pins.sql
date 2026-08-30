-- ============================================================================
-- 0013 — Favoris privés sur les résumés
-- ----------------------------------------------------------------------------
-- Chacun épingle les fiches sur lesquelles il révise. Strictement privé :
-- personne ne voit les favoris des autres.
--
-- Idempotent.
-- ============================================================================

create table if not exists public.summary_pins (
  summary_id uuid not null references public.summaries (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (summary_id, user_id)
);

create index if not exists summary_pins_user_idx on public.summary_pins (user_id);

alter table public.summary_pins enable row level security;

-- On ne touche jamais qu'à ses propres épingles ; à l'ajout, le résumé doit
-- appartenir à un cours dont on est membre.
drop policy if exists "summary_pins_rw_self" on public.summary_pins;
create policy "summary_pins_rw_self" on public.summary_pins
  for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_course_member(
      (select s.course_id from public.summaries s where s.id = summary_id)
    )
  );

grant select, insert, update, delete on public.summary_pins to authenticated;
grant all on public.summary_pins to service_role;
