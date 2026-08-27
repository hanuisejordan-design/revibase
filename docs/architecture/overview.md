# Vue d'ensemble de l'architecture

## Objectif

Structurer et capitaliser les connaissances produites par une classe. Une
question est un **objet permanent** : rattachée à une classe et à un chapitre,
elle porte des réponses, un fil de discussion, des votes, un statut de
validation, et peut alimenter des quiz.

## Stack

- **Next.js 16 (App Router)** — rendu serveur, Server Components pour les
  lectures, Server Actions pour les écritures.
- **Supabase** — PostgreSQL managé, authentification, et surtout **Row Level
  Security** : les règles d'accès vivent dans la base.
- **TypeScript strict**, **Zod** pour la validation des entrées.
- **Tailwind CSS v4** — mobile-first.

## Couches et responsabilités

```
Composant (app/, components/)
        │  props / appel d'action
        ▼
features/<domaine>/actions.ts   (écritures + permissions)
features/<domaine>/queries.ts   (lectures)
        │
        ▼
lib/supabase/{server,client}.ts  →  Supabase  →  PostgreSQL + RLS
```

- `app/` et `components/` **ne touchent jamais** la base directement.
- `features/<domaine>/` : `schema.ts` (Zod), `queries.ts` (lecture, en Server
  Component), `actions.ts` (Server Actions : valident, vérifient les
  permissions, écrivent), `types.ts` si nécessaire.
- `services/` : logique transverse (génération de quiz, notifications).
- `lib/` : clients Supabase, helpers d'auth, validation partagée, `env.ts`
  (validation des variables d'environnement via Zod), `utils/`.

## Modèle de données (MVP)

```
profiles                (1-1 avec auth.users)
classes ──< class_members >── profiles          (role: student | trainer)
classes ──< chapters
classes ──< questions >── chapters (nullable)
              │  kind: open | mcq
              ├──< answers ──< answer_votes
              │       accepted (auteur) · validated_by (formateur)
              ├──< comments                       (le fil de discussion)
              └──< question_options               (réservé mcq, Phase 8)
classes ──< quizzes ──< quiz_questions >── questions
quizzes ──< quiz_attempts ──< quiz_answers
profiles ──< notifications                        (socle, pas d'UI au MVP)
```

Détails : [`../decisions/0002-modele-donnees.md`](../decisions/0002-modele-donnees.md).
Schéma exécutable : [`../../supabase/migrations/0001_initial_schema.sql`](../../supabase/migrations/0001_initial_schema.sql).

### Statut d'affichage d'une réponse

Calculé à la lecture, par priorité décroissante :

1. **Validée formateur** — `validated_by` renseigné.
2. **Retenue par l'auteur** — `accepted = true`.
3. **Réponse communautaire** — plus grand nombre de votes (> 0).
4. **Non vérifiée** — aucune des conditions précédentes.

## Sécurité

- **RLS activée sur toutes les tables.** Un utilisateur ne voit que les
  données des classes dont il est membre. Impossible d'accéder à une autre
  classe en changeant un identifiant dans l'URL ou la requête.
- Fonctions d'aide `security definer` : `is_class_member(class)`,
  `is_class_trainer(class)`, `question_class(q)`, `answer_class(a)`.
- Règles métier appliquées **en base** quand c'est critique : seul un
  `trainer` de la classe peut renseigner `answers.validated_by` (trigger).
- Opérations atomiques via RPC `security definer` : `create_class()`,
  `join_class_by_code()`.
- Défense en profondeur : les Server Actions revérifient l'appartenance et le
  rôle avant d'écrire. Les contrôles d'interface ne sont jamais considérés
  comme suffisants.
- Privilèges au niveau table accordés à `authenticated` / `service_role`
  (migration 0001 §12 / correctif 0003) ; la RLS reste le filtre fin.

## Authentification (Phase 1)

- **Supabase Auth** (e-mail + mot de passe). L'inscription passe le nom dans
  `options.data.display_name` ; un trigger `handle_new_user` crée la ligne
  `profiles` correspondante.
- **`src/proxy.ts`** (ex-`middleware`, renommé en Next.js 16) rafraîchit la
  session à chaque requête via `@supabase/ssr`.
- **DAL** — `src/lib/auth/dal.ts` : `getUser()` (session revérifiée par
  `supabase.auth.getUser()`, mémoïsée avec `cache()`) et `requireUser()`
  (redirige vers `/login`). Appelés en tête des layouts protégés.
- Groupes de routes : `(auth)` (public, redirige les connectés vers
  `/dashboard`) et `(app)` (garde `requireUser()`).
- Server Actions `signUpAction` / `signInAction` / `signOutAction` dans
  `src/features/auth/actions.ts` ; validation Zod dans `schema.ts` ; erreurs
  traduites en français, jamais l'erreur brute.

## Classes (Phase 2)

- `src/features/classes/` : `schema.ts` (Zod), `queries.ts`
  (`getMyClasses`, `getClassContext`, `getClassMembers`), `actions.ts`
  (`createClassAction`, `joinClassAction`, `leaveClassAction`),
  `types.ts` (projections locales, faute de types générés Supabase).
- Création / adhésion via les RPC `security definer` `create_class()` et
  `join_class_by_code()` (atomiques : classe + adhésion + chapitres).
- **Isolation** : `class/[classId]/layout.tsx` appelle `getClassContext()` ;
  si l'utilisateur n'est pas membre → `notFound()`. La RLS garantit qu'aucune
  donnée d'une autre classe n'est lisible.
- `getMyClasses()` filtre sur `user_id = auth.uid()` (la RLS de
  `class_members` laisse voir tous les co-membres).
- Page `not-found.tsx` en français à la racine.

## Chapitres (Phase 3)

- `src/features/chapters/` : `schema.ts`, `queries.ts` (`listChapters`),
  `actions.ts` (`createChapter`, `renameChapter`, `moveChapter`,
  `deleteChapter`). Chaque action revérifie `role === 'trainer'` via
  `getClassContext` avant d'écrire (la RLS `chapters_*_trainer` est la
  seconde barrière).
- Gérés depuis `class/[classId]/settings` : le formateur ajoute / renomme /
  réordonne (échange de `position`) / supprime ; l'élève voit la liste en
  lecture seule.
- Supprimer un chapitre laisse ses questions (`chapter_id` → `NULL` via
  `ON DELETE SET NULL`) ; message d'avertissement dans l'UI.

## Flux d'une requête authentifiée

1. `src/proxy.ts` rafraîchit la session Supabase (cookies).
2. Le layout `(app)` appelle `requireUser()` → redirection si non connecté.
3. Le Server Component appelle `features/*/queries.ts` avec le client serveur.
4. PostgreSQL applique la RLS selon `auth.uid()`.
5. Les mutations passent par une Server Action → validation Zod → RPC ou
   `insert/update` → la RLS et les triggers refont respecter les règles.

## Notifications

Table `notifications` + `services/notifications` écrivent les événements
(`answer`, `comment`, `validation`, `new_question`). Aucune UI ni push au MVP :
seul le socle est en place pour brancher un centre de notifications plus tard.
