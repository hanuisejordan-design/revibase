-- ============================================================================
-- 0018 — course_reads : « nouvelles questions depuis la dernière visite »
-- ----------------------------------------------------------------------------
-- Marque, par (cours, utilisateur), la date de dernière consultation de la
-- liste des questions du cours. Une question est « nouvelle » si
-- `created_at > seen_at` (et pas la sienne, et pas supprimée).
--
-- Abandonne au passage le trigger `new_question` de l'ancien 0017 : une
-- nouvelle question ne passe PAS par le centre de notifications (réservé aux
-- échanges : réponse / commentaire / validation) mais par une zone dédiée au
-- niveau de la classe (cf. ADR 0022). Les `drop ... if exists` ci-dessous
-- sont sans effet si 0017 n'a jamais été appliqué.
--
-- Idempotent.
-- ============================================================================

drop trigger if exists questions_notify_new on public.questions;
drop function if exists public.notify_on_new_question();

create table if not exists public.course_reads (
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  seen_at   timestamptz not null default now(),
  primary key (course_id, user_id)
);

alter table public.course_reads enable row level security;

-- Strictement privé : chacun ne voit / n'écrit que ses propres marqueurs.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'course_reads'
      and policyname = 'course_reads_select_self'
  ) then
    create policy "course_reads_select_self" on public.course_reads
      for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'course_reads'
      and policyname = 'course_reads_insert_self'
  ) then
    create policy "course_reads_insert_self" on public.course_reads
      for insert with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'course_reads'
      and policyname = 'course_reads_update_self'
  ) then
    create policy "course_reads_update_self" on public.course_reads
      for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

grant select, insert, update, delete on public.course_reads to authenticated;
grant all on public.course_reads to service_role;
