# 0011 — Validation formateur

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 7 : un formateur peut valider officiellement une réponse. Trois états
doivent être distinguables : non vérifiée / communautaire / validée formateur
(déjà le cas via `AnswerStatusBadge`, ADR 0009).

## Décision

- **Pas de nouveau mécanisme d'autorisation** : la RLS
  `answers_update_author_or_trainer` + le trigger `enforce_answer_validation`
  (0001) font déjà respecter « seul un formateur de la classe pose
  `validated_by` », et le trigger force `validated_by = auth.uid()` +
  `validated_at = now()`.
- `toggleValidateAction` (`features/answers/actions.ts`) : garde
  `ctx.role === 'trainer'` côté serveur, puis `update({ validated_by: uid | null })`.
- `ValidateButton` visible uniquement si `viewerIsTrainer`.
- **Durcissement (migration 0007)** : la version initiale du trigger
  n'empêchait pas de _retirer_ une validation (mettre `validated_by` à NULL) —
  l'auteur de la réponse passe la RLS sur sa propre réponse. Garde symétrique
  ajoutée : retirer une validation existante exige aussi d'être formateur.
- **Gestion des rôles reportée** : aujourd'hui, créateur de la classe =
  formateur. Promouvoir un membre en formateur depuis Paramètres sera ajouté
  si un organisme de formation adopte l'outil (le rôle est secondaire dans la
  vision communautaire — cf. ADR 0007).

## Alternatives envisagées

- **RPC `set_answer_validation`** dédié (comme `accept_answer`). Superflu ici :
  la RLS autorise déjà le formateur à faire l'UPDATE, et le trigger borne les
  colonnes touchées. Le durcissement 0007 suffit.

## Conséquences

- Migration `0007` à exécuter sur les bases déjà créées.
- Une réponse peut être à la fois « retenue par l'auteur » et « validée
  formateur » ; l'affichage priorise `validated`.
- La Phase 9 (notifications) pourra écouter le passage de `validated_by` à
  non-NULL.
