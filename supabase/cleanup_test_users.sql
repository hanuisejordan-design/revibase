-- ============================================================================
-- Revibase — nettoyage des comptes de test
-- ----------------------------------------------------------------------------
-- À exécuter dans le SQL Editor de Supabase.
--
-- Supprime TOUS les comptes dont l'e-mail finit par @revibase.test :
--   * les comptes de l'ancien seed SQL (auth.users mal formés, qui cassent
--     l'API d'authentification de Supabase) ;
--   * les comptes créés pendant les tests.
--
-- Le `on delete cascade` nettoie profils, classes, adhésions, chapitres,
-- questions, réponses, votes et commentaires liés.
--
-- Ton compte personnel (autre adresse) n'est PAS touché.
-- ============================================================================

delete from auth.users where email like '%@revibase.test';
