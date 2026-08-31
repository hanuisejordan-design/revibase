-- ============================================================================
-- 0021 — Suivi de lecture par ÉLÉMENT (questions & résumés)
-- ----------------------------------------------------------------------------
-- Remplace `course_reads` (un curseur horodaté par cours) par un suivi fin :
-- une ligne quand l'utilisateur a réellement OUVERT une question / un résumé.
--
-- Motif : ouvrir la page « nouveautés » ne doit plus tout marquer comme vu.
-- Un élément ne quitte la liste que si on a cliqué dessus. Le plancher « rien
-- d'avant mon arrivée » est déduit de `course_members.joined_at` /
-- `class_members.joined_at` côté application (pas de colonne dédiée).
--
-- Idempotent. `course_reads` (migrations 0018/0019) est supprimée : ses
-- données ne sont pas récupérables mais sans valeur (au pire, quelques
-- éléments réapparaissent une fois comme « nouveaux »).
-- ============================================================================

drop table if exists public.course_reads;

create table if not exists public.question_reads (
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  seen_at     timestamptz not null default now(),
  primary key (question_id, user_id)
);
create index if not exists question_reads_user_idx on public.question_reads (user_id);

create table if not exists public.summary_reads (
  summary_id uuid not null references public.summaries (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  seen_at    timestamptz not null default now(),
  primary key (summary_id, user_id)
);
create index if not exists summary_reads_user_idx on public.summary_reads (user_id);

alter table public.question_reads enable row level security;
alter table public.summary_reads  enable row level security;

-- Strictement privé : chacun ne gère que ses propres marqueurs.
do $$
declare
  t text;
begin
  foreach t in array array['question_reads', 'summary_reads'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public'
                   and tablename = t and policyname = t || '_select_self') then
      execute format(
        'create policy %I on public.%I for select using (user_id = auth.uid())',
        t || '_select_self', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public'
                   and tablename = t and policyname = t || '_insert_self') then
      execute format(
        'create policy %I on public.%I for insert with check (user_id = auth.uid())',
        t || '_insert_self', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public'
                   and tablename = t and policyname = t || '_delete_self') then
      execute format(
        'create policy %I on public.%I for delete using (user_id = auth.uid())',
        t || '_delete_self', t);
    end if;
  end loop;
end $$;

grant select, insert, update, delete on public.question_reads to authenticated;
grant select, insert, update, delete on public.summary_reads  to authenticated;
grant all on public.question_reads to service_role;
grant all on public.summary_reads  to service_role;
