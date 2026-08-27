# 0006 — Chapitres : gestion par le formateur

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 3 : le formateur doit pouvoir créer, renommer, réordonner et supprimer
les chapitres de sa classe. Les élèves les consultent seulement.

## Décision

- CRUD dans `src/features/chapters/actions.ts` (Server Actions). Chaque
  mutation appelle `getClassContext(classId)` et refuse si
  `role !== 'trainer'` — **en plus** de la RLS `chapters_insert_trainer` /
  `_update_trainer` / `_delete_trainer` (défense en profondeur).
- **Réordonnancement** : boutons ↑ / ↓ par ligne ; l'action échange la
  colonne `position` avec le voisin (deux `UPDATE`). Suffisant à l'échelle
  d'une classe ; un tri glisser-déposer ou une RPC atomique pourront venir
  plus tard.
- **Suppression** : `ON DELETE SET NULL` sur `questions.chapter_id` (déjà au
  schéma, ADR 0002). Les questions ne sont pas perdues, elles deviennent
  « sans chapitre ». Confirmation `confirm()` + message explicite.
- **UI** : page `class/[classId]/settings`. Formateur → éditeur complet
  (`ChapterListEditor` + `AddChapterForm`, `useActionState` pour les
  erreurs) ; élève → liste en lecture seule. Lien « Paramètres » ajouté à
  l'en-tête de la classe.

## Alternatives envisagées

- **Chapitres créés librement par n'importe quel membre.** Rejeté : le brief
  réserve la gestion des chapitres au formateur ; un jeu par défaut est déjà
  créé à l'ouverture de la classe (`create_class`).
- **Champ `position` recalculé sur toute la liste à chaque déplacement.**
  Inutilement lourd ; l'échange à deux suffit et garde des positions
  distinctes (création = max + 1).

## Conséquences

- Un chapitre supprimé peut laisser des questions orphelines — l'UI de la
  Phase 4 devra afficher un groupe « Sans chapitre ».
- L'unicité `(class_id, name)` fait remonter une erreur `23505` traduite en
  « Un chapitre porte déjà ce nom ».
