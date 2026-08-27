-- ============================================================================
-- Revibase — données de démonstration
-- ----------------------------------------------------------------------------
-- À exécuter sur une base FRAÎCHE, après la migration 0001 :
--
--   supabase db reset          # en local (CLI Supabase + Docker) : auto
--   ou : coller dans Supabase Studio → SQL Editor (projet de test)
--
-- Crée 1 formatrice, 3 élèves, 1 classe (code DEMO2026), 4 chapitres et
-- quelques questions/réponses/votes/commentaires pour explorer l'app.
--
-- Comptes (mot de passe commun : "password123") :
--   formateur@revibase.test   (formatrice)
--   thomas@revibase.test / julie@revibase.test / marc@revibase.test  (élèves)
--
-- NB : la structure de `auth.users` peut varier selon la version de Supabase.
-- Si l'insertion échoue, créez les comptes via l'UI d'auth puis ne gardez
-- que la partie « Contenu » ci-dessous en adaptant les UUID.
-- ============================================================================

begin;

-- ---- Comptes d'authentification -------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'formateur@revibase.test',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Sofia (formatrice)"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'thomas@revibase.test',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Thomas"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'julie@revibase.test',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Julie"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'marc@revibase.test',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Marc"}',
   now(), now())
on conflict (id) do nothing;

insert into auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"formateur@revibase.test"}',
   'email', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"thomas@revibase.test"}',
   'email', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"julie@revibase.test"}',
   'email', now(), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   '{"sub":"44444444-4444-4444-4444-444444444444","email":"marc@revibase.test"}',
   'email', now(), now(), now())
on conflict do nothing;

-- Filet de sécurité si le trigger handle_new_user n'a pas tourné.
insert into public.profiles (id, display_name)
values
  ('11111111-1111-1111-1111-111111111111', 'Sofia (formatrice)'),
  ('22222222-2222-2222-2222-222222222222', 'Thomas'),
  ('33333333-3333-3333-3333-333333333333', 'Julie'),
  ('44444444-4444-4444-4444-444444444444', 'Marc')
on conflict (id) do nothing;

-- ---- Classe, membres, chapitres -----------------------------------------
insert into public.classes (id, name, join_code, created_by)
values ('a0000000-0000-0000-0000-000000000001',
        'Promo Conduite — 2026', 'DEMO2026',
        '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.class_members (class_id, user_id, role)
values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'trainer'),
  ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'student'),
  ('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'student'),
  ('a0000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'student')
on conflict (class_id, user_id) do nothing;

insert into public.chapters (id, class_id, name, position)
values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Signalisation', 0),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Réglementation', 1),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Matériel', 2),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sécurité', 3)
on conflict (class_id, name) do nothing;

-- ---- Questions --------------------------------------------------------
insert into public.questions (id, class_id, chapter_id, author_id, title, body)
values
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Que signifie un signal carré violet ?',
   'Vu en simulateur, je confonds avec le carré. Quelle est la différence de conduite à tenir ?'),
  ('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Différence entre un sémaphore et un feu rouge fixe ?',
   null),
  ('40000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444',
   'Dans quels cas doit-on demander une autorisation de franchissement ?',
   'Je n''arrive pas à retenir la liste exhaustive.'),
  ('40000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'Procédure d''essai de frein avant départ : les étapes ?',
   null),
  ('40000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333',
   'Que faire en cas de heurt d''obstacle sur la voie ?',
   'Ordre des actions : protéger, alerter, ... ?'),
  ('40000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'La marche à vue : quelle vitesse maximale et quelle règle de distance ?',
   null)
on conflict (id) do nothing;

-- ---- Réponses -------------------------------------------------------
insert into public.answers (id, question_id, author_id, body, accepted)
values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333',
   'Le carré violet concerne les mouvements de manœuvre : il commande l''arrêt aux mouvements de manœuvre mais peut être franchi par un train en marche normale sauf indication contraire.',
   true),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001',
   '44444444-4444-4444-4444-444444444444',
   'Moyen mnémo : violet = manœuvre. Le carré (rouge/blanc) arrête tout le monde.',
   false),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222',
   'Le sémaphore protège un canton et peut être franchi selon une procédure précise après arrêt ; un feu rouge fixe de type carré impose l''arrêt absolu.',
   false),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005',
   '44444444-4444-4444-4444-444444444444',
   'Ordre : je protège (couvrir la voie concernée et les voies contiguës si besoin), j''alerte (agent-circulation), je rends compte, puis je reconnais si les conditions le permettent.',
   false)
on conflict (id) do nothing;

-- Validation formateur (déclenche le trigger enforce_answer_validation via
-- un UPDATE fait par un rôle qui bypass RLS : on renseigne directement).
update public.answers
set validated_by = '11111111-1111-1111-1111-111111111111',
    validated_at = now()
where id = '50000000-0000-0000-0000-000000000001';

-- ---- Votes ---------------------------------------------------------
insert into public.answer_votes (answer_id, user_id)
values
  ('50000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('50000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444'),
  ('50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('50000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
  ('50000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333')
on conflict (answer_id, user_id) do nothing;

-- ---- Discussion ---------------------------------------------------
insert into public.comments (question_id, author_id, body)
values
  ('40000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Merci, c''est plus clair. Donc en marche normale je ne m''arrête pas devant un violet ?'),
  ('40000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Exact, en marche normale il ne te concerne pas. On revoit ça au prochain TP.'),
  ('40000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333',
   'Le "protéger d''abord" est la clé : on ne descend jamais sans avoir couvert.')
on conflict do nothing;

commit;
