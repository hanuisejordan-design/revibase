# 0013 — Types de question : ouverte / vrai-faux / QCM

- Statut : accepté
- Date : 2026-08-27
- Voir aussi : [0003](0003-quiz-auto-evaluation.md), [0008](0008-questions.md),
  [0012](0012-quiz.md)

## Contexte

Après un premier déploiement, besoin de questions à choix pour des quiz
**corrigés automatiquement** (le score objectif que l'auto-évaluation seule ne
donne pas). Périmètre volontairement limité : ouverte, vrai/faux, QCM — pas
d'association, d'ordonnancement, etc.

## Décision

- **`questions.kind`** : `open` | `true_false` | `mcq` (migration 0008).
- **Stockage uniforme** : `true_false` et `mcq` utilisent la table
  `question_options` (`body`, `is_correct`, `position`). Vrai/faux = un QCM à
  deux options pré-remplies. `question_options` devient gérable par **tout
  membre** (comme les chapitres, ADR 0007).
- **Une seule bonne réponse** par question (bouton radio). Multi-correct :
  hors périmètre.
- **Type figé à la création**, non modifiable (cohérent avec l'absence
  d'édition de question).
- **Page d'une question** :
  - `open` : réponses communautaires + votes + validation + discussion
    (inchangé) ;
  - `true_false` / `mcq` : les options avec la bonne en vert, **plus la
    Discussion** (la formulation d'un QCM mérite parfois un échange), mais
    **sans** la section « Réponses ».
- **Quiz** :
  - le générateur priorise les questions « prêtes » (QCM/V-F + ouvertes ayant
    une réponse de référence) ;
  - `QuizRunner` branche par type : QCM/V-F = options cliquables + retour
    immédiat rouge/vert ; ouverte = révéler la référence + « je savais / à
    revoir » ;
  - **le score des QCM est calculé côté serveur** (`submitQuizAction` relit
    `question_options.is_correct` d'après `selected_option_id`) — le client
    ne peut pas fausser le score ; l'auto-évaluation des ouvertes reste
    déclarative par nature ;
  - `quiz_answers.selected_option_id` ajouté (migration 0008) ; `is_correct`
    unifie les deux modes ; « à revoir » = `is_correct = false`.

## Alternatives écartées

- **QCM multi-correct** : scoring ambigu (crédit partiel ?), reporté.
- **Réutiliser `answers.selected_answer_id`** pour l'option choisie : les
  options vivent dans `question_options`, pas `answers` — colonne dédiée.
- **Un aller-retour serveur par question pour la correction** : inutile, le
  client connaît déjà `is_correct` (outil de révision, pas examen surveillé) ;
  seule la note finale est vérifiée côté serveur.

## Conséquences

- Le sélecteur de type sur « Poser une question » rend le formulaire un peu
  plus dense ; l'ouverte reste la valeur par défaut.
- Un QCM créé par erreur se supprime + se recrée (pas d'édition).
- Le seed (`seed.mjs`) inclut désormais un vrai/faux et un QCM de démo.
