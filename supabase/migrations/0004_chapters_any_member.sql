-- ============================================================================
-- Revibase — chapitres gérables par tout membre de la classe
-- ----------------------------------------------------------------------------
-- Vision communautaire : au départ, ce sont les élèves qui structurent la
-- matière. Le rôle « formateur » reste utilisé pour la validation officielle
-- des réponses (Phase 7) et d'éventuels déploiements « école ».
--
-- À exécuter dans le SQL Editor si tu as appliqué 0001 avant ce changement.
-- ============================================================================

drop policy if exists "chapters_insert_trainer" on public.chapters;
drop policy if exists "chapters_update_trainer" on public.chapters;
drop policy if exists "chapters_delete_trainer" on public.chapters;

create policy "chapters_insert_member" on public.chapters
  for insert with check (public.is_class_member(class_id));

create policy "chapters_update_member" on public.chapters
  for update using (public.is_class_member(class_id))
  with check (public.is_class_member(class_id));

create policy "chapters_delete_member" on public.chapters
  for delete using (public.is_class_member(class_id));
