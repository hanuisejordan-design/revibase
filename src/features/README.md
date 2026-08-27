# `features/` — logique par domaine

Un dossier par domaine fonctionnel. Chaque domaine expose (au fur et à mesure
des phases) les mêmes fichiers :

| Fichier      | Rôle                                                                |
| ------------ | ------------------------------------------------------------------- |
| `schema.ts`  | Schémas Zod : validation des entrées (formulaires, Server Actions). |
| `queries.ts` | Lectures en base (Server Components). Aucune écriture ici.          |
| `actions.ts` | Server Actions : écritures + vérification des permissions.          |
| `types.ts`   | Types propres au domaine (si non couverts par `src/types`).         |

Règles :

- Les composants de `src/app` et `src/components` **n'accèdent jamais** à la
  base directement : ils passent par `queries.ts` / `actions.ts`.
- Toute écriture vérifie l'appartenance à la classe **côté serveur**, en plus
  des règles RLS de la base (défense en profondeur).

Domaines : `auth`, `classes`, `chapters`, `questions`, `answers`,
`discussions`, `quizzes`.
