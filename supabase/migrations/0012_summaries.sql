-- ============================================================================
-- 0012 — Résumés par cours
-- ----------------------------------------------------------------------------
-- Un « résumé » = un fichier (PDF, image, …) + un titre, optionnellement
-- rattaché à un chapitre. Déposé par n'importe quel membre du cours,
-- supprimable par l'auteur ou un formateur. Fichier dans un bucket Storage
-- PRIVÉ, chemin `{course_id}/{uuid}.ext` (mêmes policies « membre du cours »
-- que les photos de question, cf. 0010 + renommage 0011).
--
-- Idempotent.
-- ============================================================================

create table if not exists public.summaries (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 200),
  file_path  text not null,
  file_name  text not null check (char_length(file_name) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists summaries_course_idx on public.summaries (course_id, created_at desc);

alter table public.summaries enable row level security;

drop policy if exists "summaries_select_member" on public.summaries;
create policy "summaries_select_member" on public.summaries
  for select using (public.is_course_member(course_id));

drop policy if exists "summaries_insert_member" on public.summaries;
create policy "summaries_insert_member" on public.summaries
  for insert with check (public.is_course_member(course_id) and author_id = auth.uid());

drop policy if exists "summaries_delete_author_or_trainer" on public.summaries;
create policy "summaries_delete_author_or_trainer" on public.summaries
  for delete using (author_id = auth.uid() or public.is_course_trainer(course_id));

-- Bucket privé pour les fichiers de résumé.
insert into storage.buckets (id, name, public)
values ('summaries', 'summaries', false)
on conflict (id) do nothing;

drop policy if exists "summaries_files_select_member" on storage.objects;
create policy "summaries_files_select_member" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'summaries'
    and public.is_course_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "summaries_files_insert_member" on storage.objects;
create policy "summaries_files_insert_member" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'summaries'
    and public.is_course_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "summaries_files_delete_member" on storage.objects;
create policy "summaries_files_delete_member" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'summaries'
    and public.is_course_member(((storage.foldername(name))[1])::uuid)
  );

grant select, insert, update, delete on public.summaries to authenticated;
grant all on public.summaries to service_role;
