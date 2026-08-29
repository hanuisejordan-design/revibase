-- ============================================================================
-- 0010 — Photo attachée à une question
-- ----------------------------------------------------------------------------
-- Une image par question (`questions.image_path`), stockée dans un bucket
-- Storage PRIVÉ. Chemin : `{class_id}/{uuid}.jpg` — le 1er dossier permet aux
-- policies Storage de vérifier l'appartenance à la classe. L'affichage passe
-- par une URL signée générée côté serveur.
--
-- Idempotent.
-- ============================================================================

alter table public.questions add column if not exists image_path text;

-- Bucket privé.
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', false)
on conflict (id) do nothing;

-- Accès réservé aux membres de la classe : (storage.foldername(name))[1] est
-- le class_id. `is_class_member` est `security definer` (défini en 0001,
-- étendu aux groupes en 0009).
drop policy if exists "question_images_select_member" on storage.objects;
create policy "question_images_select_member" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'question-images'
    and public.is_class_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "question_images_insert_member" on storage.objects;
create policy "question_images_insert_member" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'question-images'
    and public.is_class_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "question_images_delete_member" on storage.objects;
create policy "question_images_delete_member" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'question-images'
    and public.is_class_member(((storage.foldername(name))[1])::uuid)
  );
