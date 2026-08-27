# 0008 — Questions : liste, filtres, détail

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 4 : créer une question, la lister (filtre chapitre, recherche, tri),
page dédiée. C'est le cœur du produit — la question comme objet permanent.

## Décision

- `src/features/questions/` : `schema.ts` (Zod + `parseSort`), `types.ts`,
  `queries.ts` (`listQuestions`, `getRecentQuestions`, `getQuestion`),
  `actions.ts` (`createQuestionAction`, `deleteQuestionAction`).
- **Filtres via l'URL** (`?chapter=<id|none>&q=<texte>&sort=recent|unanswered|popular`).
  La page de liste lit `searchParams` ; `QuestionFilters` est un composant
  serveur (chips `<Link>` + formulaire `next/form` pour la recherche), aucun
  JS client.
- **Recherche** : `ILIKE` sur le titre (suffisant au MVP ; plein-texte
  PostgreSQL plus tard, cf. ADR 0002).
- **Comptes & statut** : `listQuestions` récupère les questions puis, en 2
  requêtes (`answers`, `comments` filtrés `IN (ids)`), calcule par question le
  nombre de réponses / commentaires et le statut (`validated` si une réponse
  validée, sinon `answered` / `unanswered`). Tri `unanswered` / `popular`
  appliqué en mémoire. Acceptable à l'échelle d'une classe.
- **Chapitre à la création** : optionnel (`— Sans chapitre —`). L'action
  vérifie que le chapitre choisi appartient bien à la classe (la RLS
  `questions_insert_member` ne contrôle que la classe + l'auteur).
- **Suppression** : douce (`deleted_at`), réservée à l'auteur ou à un
  formateur, avec confirmation. Les données restent (« objet permanent ») ;
  toutes les lectures filtrent `.is('deleted_at', null)`.
- **Réorganisation de l'IA** : l'accueil de classe devient orienté questions
  (poser / récentes / chapitres) ; le code d'invitation et la liste des
  participants passent dans `class/[classId]/settings`. Onglet « Questions »
  ajouté à l'en-tête de classe.

## Soft-delete vs RLS

La policy `questions_select_member` exigeait `deleted_at IS NULL`. Renseigner
`deleted_at` faisait sortir la ligne de la policy → PostgreSQL rejetait
l'`UPDATE` (« new row violates row-level security policy »). Corrigé
(migration 0005 / 0001) : **la RLS ne gère que l'autorisation** (la classe),
le masquage des supprimées est la responsabilité de l'application.

## Alternatives envisagées

- **`ORDER BY` sur un agrégat côté base** (nombre de réponses) via une vue ou
  une RPC. Reporté : le tri en mémoire suffit pour l'instant.
- **Suppression dure.** Rejetée : contraire à « objet permanent » et casse les
  références (quiz à venir).
- **Édition d'une question.** Reportée (post-MVP) ; la suppression + re-création
  dépanne au besoin.

## Conséquences

- Si une lecture oubliait `.is('deleted_at', null)`, des questions supprimées
  réapparaîtraient (bug d'affichage, pas de fuite : toujours borné à la
  classe). Les 3 fonctions de `queries.ts` l'ont.
- Les Phases 5-6 (réponses, discussion) remplaceront l'encart « à venir » de
  la page question.
