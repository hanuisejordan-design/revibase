# 0002 — Modèle de données

- Statut : accepté
- Date : 2026-08-27

## Contexte

Le brief propose une liste d'entités hypothétique. Il fallait la confronter
aux besoins réels du MVP et lever plusieurs ambiguïtés.

## Décision

Tables retenues : `profiles`, `classes`, `class_members`, `chapters`,
`questions`, `question_options` (réservé), `answers`, `answer_votes`,
`comments`, `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_answers`,
`notifications`. Schéma exécutable :
[`../../supabase/migrations/0001_initial_schema.sql`](../../supabase/migrations/0001_initial_schema.sql).

Points tranchés :

1. **Rôle par classe, pas par compte.** `class_members.role ∈ {student,
trainer}`. Le créateur d'une classe en devient `trainer`. Quelqu'un peut
   être formateur d'une classe et élève d'une autre.

2. **Trois signaux distincts sur une réponse**, combinés à l'affichage :
   - `answer_votes` → réponse « communautaire » (la plus votée, > 0) ;
   - `answers.accepted` → « retenue par l'auteur de la question » ;
   - `answers.validated_by` / `validated_at` → « validée par un formateur ».
     Priorité d'affichage : validée > retenue > communautaire > non vérifiée.

3. **Vote positif simple** : présence d'une ligne `answer_votes(answer, user)`
   unique. Pas de valeur, pas de vote négatif au MVP.

4. **`questions.kind ∈ {open, mcq}`** ajouté dès maintenant, `open` par
   défaut. `question_options` créée mais non utilisée avant la Phase 8 :
   permet le QCM auto-corrigé plus tard sans migration douloureuse.

5. **Chapitre nullable sur une question** (`on delete set null`) : supprimer
   un chapitre ne détruit pas les questions. L'UI impose un chapitre à la
   création.

6. **Suppression douce des questions** : colonne `deleted_at`. Une question
   citée dans un quiz ne doit pas disparaître brutalement. Suppression dure
   hors MVP.

7. **Quiz — auto-évaluation** : `quiz_answers.knew_it` (booléen) pour le mode
   `self_assessment` ; `selected_answer_id` réservé au futur mode `mcq`. Voir
   [0003](0003-quiz-auto-evaluation.md).

8. **Sécurité en base** : RLS sur toutes les tables via
   `is_class_member()` / `is_class_trainer()` (`security definer` pour éviter
   la récursion). Trigger `enforce_answer_validation` : seul un `trainer` de
   la classe peut renseigner `validated_by`. RPC atomiques `create_class()`
   et `join_class_by_code()`.

9. **Notifications** : table + index prêts, aucune écriture déclenchée au MVP
   (socle uniquement).

## Alternatives envisagées

- **Rôle global sur `profiles`.** Plus simple mais faux dès qu'un utilisateur
  a deux classes avec des rôles différents.
- **Vote signé (+1 / -1).** Plus expressif mais plus toxique et inutile pour
  une classe. Reporté.
- **Pas de `deleted_at`, suppression dure + `on delete cascade`.** Risque de
  perdre du contenu référencé par des quiz ou des révisions.
- **Statut de réponse stocké en dur (`status` unique).** Rejeté : les trois
  signaux sont indépendants (une réponse peut être votée ET validée) ; les
  garder séparés évite les incohérences.

## Conséquences

- Les policies RLS sur les tables « filles » (answers, votes, comments)
  passent par des fonctions `*_class()` : un `select` supplémentaire par
  vérification, acceptable à cette échelle, indexé sur les clés.
- `answer_vote_counts` est une vue `security_invoker` : les décomptes
  respectent la RLS de l'appelant.
- La génération des types TypeScript depuis Supabase remplacera à terme le
  fichier écrit à la main `src/types/database.ts`.
