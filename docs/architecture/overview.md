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

## Flux d'une requête authentifiée

1. `middleware` (dès la Phase 1) rafraîchit la session Supabase (cookies).
2. Le Server Component appelle `features/*/queries.ts` avec le client serveur.
3. PostgreSQL applique la RLS selon `auth.uid()`.
4. Les mutations passent par une Server Action → validation Zod → RPC ou
   `insert/update` → la RLS et les triggers refont respecter les règles.

## Notifications

Table `notifications` + `services/notifications` écrivent les événements
(`answer`, `comment`, `validation`, `new_question`). Aucune UI ni push au MVP :
seul le socle est en place pour brancher un centre de notifications plus tard.
