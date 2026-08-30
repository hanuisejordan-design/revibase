# 0020 — Édition d'une question

- Statut : accepté
- Date : 2026-08-30
- Voir aussi : [0008](0008-questions.md), [0013](0013-types-de-question.md),
  [0016](0016-photo-question.md)

## Contexte

Jusqu'ici une question ne pouvait être que **créée** ou **supprimée**
(suppression douce). Corriger une faute de frappe imposait de supprimer +
recréer, perdant réponses et discussion.

## Décision

- **`updateQuestionAction`** : modifie **titre, contexte, chapitre, options
  (QCM / vrai-faux), photo**. Réservé à **l'auteur ou un formateur** (garde
  applicatif + RLS `questions_update_author_or_trainer` déjà en place — pas de
  migration).
- Le **type** (`kind`) n'est **pas modifiable** : transformer une question
  ouverte en QCM après coup n'a pas de sens propre. Le formulaire l'affiche en
  lecture seule ; l'action ignore ce que le champ enverrait et repart de
  `questions.kind` en base.
- Le formulaire de création `CreateQuestionForm` devient **`QuestionForm`**
  avec une prop `initial` optionnelle (mode édition) ; route
  `course/[courseId]/questions/[questionId]/edit`.
- **Options** (si `kind !== open`) : remplacées en bloc — `delete` puis
  `insert` des nouvelles. Simple ; `quiz_answers.selected_option_id` des
  tentatives passées passe à `NULL` (`ON DELETE SET NULL`), mais
  `quiz_answers.is_correct` était déjà figé → le score des anciennes
  tentatives ne bouge pas, seul le détail « quelle option » est perdu.
- **Photo** : trois cas gérés — nouvelle image (téléversée, remplace ;
  l'ancienne est supprimée du bucket), retirée (`removeImage`), ou inchangée.

## Alternatives écartées

- **Autoriser le changement de type** : cas limites ingérables (une ouverte
  avec des réponses devient un QCM ?).
- **Diff fin des options** (garder les ids stables) : plus de code pour peu
  de gain ; la perte est cosmétique (détail d'une vieille tentative de quiz).
- **Historique / versions** : hors périmètre.

## Conséquences

- Un formateur peut corriger la question d'un élève (comme il peut déjà la
  supprimer / valider une réponse).
- Éditer les options d'un QCM déjà utilisé en quiz : les tentatives passées
  gardent leur score mais perdent le lien vers l'option choisie.
