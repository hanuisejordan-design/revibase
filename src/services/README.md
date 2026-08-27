# `services/` — logique métier transverse

Pour la logique qui ne rentre pas dans un seul domaine `features/` ou qui a
sa propre complexité.

- `quiz-generator/` : sélection des questions d'un quiz (par chapitre, nombre
  demandé, priorité aux questions avec réponse validée, tirage aléatoire).
- `notifications/` : écriture des événements (`answer`, `comment`,
  `validation`, `new_question`) dans la table `notifications`. Socle only au
  MVP — pas d'envoi push.

Ces modules sont appelés depuis les `actions.ts` des domaines concernés.
