-- ============================================================================
-- Revibase — soft-delete des questions compatible avec la RLS
-- ----------------------------------------------------------------------------
-- Problème : la policy SELECT exigeait `deleted_at IS NULL`. Renseigner
-- `deleted_at` faisait « disparaître » la ligne → PostgreSQL rejette l'UPDATE
-- (« new row violates row-level security policy »).
--
-- Correction : la RLS ne porte plus que sur l'autorisation (appartenance à la
-- classe). Le masquage des questions supprimées est fait par l'application
-- (chaque lecture filtre déjà `.is('deleted_at', null)`).
--
-- À exécuter dans le SQL Editor si 0001 a été appliqué avant ce correctif.
-- ============================================================================

drop policy if exists "questions_select_member" on public.questions;

create policy "questions_select_member" on public.questions
  for select using (public.is_class_member(class_id));
