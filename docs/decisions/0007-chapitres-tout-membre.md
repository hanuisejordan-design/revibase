# 0007 — Chapitres gérables par tout membre

- Statut : accepté
- Date : 2026-08-27
- Remplace : [0006](0006-chapitres.md)

## Contexte

L'ADR 0006 réservait la gestion des chapitres au formateur. Or le produit est
**communautaire d'abord** : au départ, il n'y aura souvent aucun formateur
dans la classe, ce sont les élèves eux-mêmes qui structurent la matière. Le
verrou « formateur » empêchait l'usage principal visé.

Le rôle « formateur » n'est pas supprimé : il sert toujours à la **validation
officielle des réponses** (Phase 7) et pourra encadrer plus de choses si des
écoles adoptent l'outil.

## Décision

**Tout membre d'une classe peut créer, renommer, réordonner et supprimer les
chapitres de cette classe.**

- RLS : `chapters_insert_member` / `_update_member` / `_delete_member` avec
  `public.is_class_member(class_id)` (migration `0004_chapters_any_member.sql`,
  et `0001` mis à jour pour les installations neuves).
- Server Actions (`features/chapters/actions.ts`) : la garde passe de
  « est formateur » à « est membre » (`getClassContext(classId) !== null`).
- UI `class/[classId]/settings` : l'éditeur de chapitres est visible par tous
  les membres ; plus de vue « lecture seule ».

## Alternatives envisagées

- **Création ouverte, mais suppression/renommage réservés au formateur ou au
  créateur du chapitre.** Rejeté pour le MVP : `chapters` n'a pas de
  `created_by`, et dans une petite classe qui se connaît, la confiance
  mutuelle suffit. La confirmation + l'`ON DELETE SET NULL` limitent déjà les
  dégâts d'une suppression accidentelle.
- **Réglage par classe « qui peut gérer les chapitres ».** Repoussé : à
  ajouter si un déploiement « école » le demande.

## Conséquences

- Cohérent avec le reste du MVP, où poser des questions / répondre / voter /
  commenter est déjà ouvert à tout membre.
- Si l'outil est adopté par des organismes de formation, prévoir un cran de
  configuration pour re-restreindre (nouvel ADR à ce moment-là).
