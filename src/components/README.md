# `components/` — composants d'interface

- `ui/` : primitives génériques et sans logique métier (`Button`, `Input`,
  `Badge`, `Card`, `Dialog`…). Réutilisables partout.
- `questions/`, `answers/`, `discussions/`, `quizzes/`, `classes/` :
  composants d'affichage propres à un domaine (ex. `QuestionCard`,
  `AnswerList`, `VoteButton`). Ils reçoivent leurs données en props et
  déclenchent des Server Actions ; ils ne lisent pas la base eux-mêmes.

Un composant qui grossit trop ou qui mélange affichage et accès aux données
doit être découpé : l'accès aux données remonte dans `src/features/<domaine>`.
