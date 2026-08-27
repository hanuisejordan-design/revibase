# 0010 — Discussions

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 6 : chaque question a son propre fil de discussion, rattaché pour
toujours (brief §13). À distinguer des réponses : les réponses sont des
tentatives de réponse (votables, « retenables », validables) ; la discussion
est un échange chronologique autour de la question.

## Décision

- `src/features/discussions/` : `schema.ts`, `types.ts`, `queries.ts`
  (`listComments` — ordre chronologique croissant), `actions.ts`
  (`createCommentAction`, `deleteCommentAction`).
- Table `comments` et RLS déjà en place (0001). `comments` n'a qu'une FK vers
  `profiles` → pas d'ambiguïté d'embed (contrairement à `answers`, ADR 0009).
- Pas de vote, pas de statut, pas d'édition. Suppression réservée à l'auteur
  du message ou à un formateur, avec confirmation.
- La page question affiche : Réponses (+ formulaire), puis Discussion
  (+ formulaire), avec une phrase qui rappelle la différence.
- Aucune migration.

## Alternatives envisagées

- **Fusionner réponses et commentaires** en un seul fil. Rejeté : le brief
  sépare explicitement les deux, et le tri / vote / validation ne s'applique
  qu'aux réponses.
- **Commentaires imbriqués (threads dans le thread).** Hors périmètre MVP ;
  un fil plat suffit pour une classe.

## Conséquences

- `questions.commentCount` (calculé dans `features/questions`) reste utilisé
  pour les cartes de liste ; la page question utilise `comments.length`.
- Les Phases 9 (notifications) pourront écouter les insertions dans
  `comments`.
