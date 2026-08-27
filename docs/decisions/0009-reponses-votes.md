# 0009 — Réponses & votes

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 5 : répondre à une question, voter, afficher la plus populaire,
permettre à l'auteur de la question de « retenir » une réponse.

## Décision

- `src/features/answers/` : `schema.ts`, `types.ts`, `queries.ts`
  (`listAnswers`), `actions.ts` (`createAnswerAction`, `toggleVoteAction`,
  `toggleAcceptAction`, `deleteAnswerAction`).
- **Vote** : présence/absence d'une ligne `answer_votes(answer, user)`
  (unique). `toggleVoteAction` insère ou supprime. Pas de vote négatif.
- **Tri des réponses** : validée (formateur) > retenue (auteur) > nombre de
  votes décroissant > ancienneté. Calculé en mémoire dans `listAnswers`.
- **Badge de statut par réponse** : `validated` / `accepted` / `community`
  (la plus votée avec votes > 0) / `unverified` (rien).
- **Retenir une réponse** : la réponse est souvent écrite par un autre membre,
  donc la RLS `answers_update_author_or_trainer` interdit l'UPDATE direct par
  l'auteur de la question. → **RPC `security definer` `accept_answer(p_answer)`**
  (migration 0006) qui vérifie `auth.uid() = questions.author_id` puis
  bascule `accepted` (une seule réponse retenue par question).
- **Suppression** d'une réponse : dure (pas de `deleted_at` sur `answers` ;
  `quiz_answers.selected_answer_id` est `ON DELETE SET NULL`). Réservée à
  l'auteur de la réponse ou à un formateur, avec confirmation.
- La liste des questions garde son statut à 3 valeurs
  (`validated` / `answered` / `unanswered`) ; « retenue » n'y apparaît pas
  (conforme aux maquettes du brief).

## Alternatives envisagées

- **Élargir la RLS `answers` UPDATE à l'auteur de la question.** Rejeté :
  laisserait aussi modifier le corps de la réponse ; l'RPC est borné à la
  colonne `accepted`.
- **Client service_role dans la Server Action** pour contourner la RLS.
  Rejeté : la garantie ne vivrait que dans le code applicatif ; l'RPC
  l'ancre en base et suit le pattern existant (`create_class`, …).
- **Vote signé / plusieurs réponses retenues.** Hors périmètre (ADR 0002).

## Conséquences

- Une migration de plus (`0006`) à exécuter sur les bases déjà créées.
- `toggleAcceptAction` ne remonte pas d'erreur visible si l'RPC échoue
  (ex. appelé par un non-auteur) : l'UI ne montre le bouton qu'à l'auteur de
  la question, et l'RPC refuse de toute façon. Un retour d'erreur explicite
  pourra être ajouté au polissage (Phase 10).
- Les Phases 6-7 (discussion, validation formateur) réutiliseront ces briques.
