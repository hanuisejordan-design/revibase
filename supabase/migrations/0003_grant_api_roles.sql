-- ============================================================================
-- Revibase — correctif : privilèges des rôles API sur le schéma public
-- ----------------------------------------------------------------------------
-- À exécuter si tu as appliqué 0001 AVANT ce correctif (symptôme :
--   ERROR: permission denied for table profiles
-- ou, dans l'app, ton nom d'affichage retombe sur ton adresse e-mail).
--
-- Un projet Supabase récent n'accorde pas toujours automatiquement les
-- privilèges aux rôles `anon` / `authenticated` / `service_role` sur les
-- tables créées via l'éditeur SQL. Ces GRANT ouvrent l'accès au niveau
-- table ; la RLS reste le filtre fin, ligne par ligne.
--
-- Idempotent : relancer ne fait aucun mal.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to authenticated, service_role;
