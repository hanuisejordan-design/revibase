# 0024 — Suivi de lecture par élément (remplace le curseur de [0022](0022-nouvelles-questions.md))

- Statut : accepté
- Date : 2026-08-31
- Amende : [0022](0022-nouvelles-questions.md) (le reste de 0022 — vignettes,
  zones `nouvelles` / `nouveaux-resumes`, code couleur — est inchangé).

## Contexte

[0022](0022-nouvelles-questions.md) marquait une nouveauté comme « vue » dès
qu'on **ouvrait la page** qui la liste (`course_reads.questions_seen_at`,
un curseur horodaté par cours, poussé par un effet client au montage).

En usage réel : on ouvre `class/[id]/nouvelles`, on n'a pas le temps de lire
que la liste se vide (l'effet a déjà avancé le curseur, le rendu suivant est
vide). On perd la trace de ce qu'on voulait consulter.

## Décision

**Marquer chaque élément lu individuellement, seulement quand on l'ouvre.**

- **Migration `0021`** : `question_reads (question_id, user_id, seen_at)` et
  `summary_reads (summary_id, user_id, seen_at)`, privées
  (RLS `user_id = auth.uid()`). `course_reads` est **supprimée**.
- **« Nouveau »** pour l'utilisateur `u` dans un cours `c` :
  - `question.created_at > memberSince(u, c)` — plancher = le plus tôt entre
    `course_members.joined_at` et `class_members.joined_at` (classe parente).
    Évite qu'un nouvel arrivant croule sous tout l'historique.
  - `question.author_id <> u` et `deleted_at is null`
  - `question.id` **absent** de `question_reads` pour `u`.
- **Marquage** :
  - question → `MarkQuestionRead` (effet au montage de la page détail) →
    `markQuestionReadAction`. Ouvrir la question = l'avoir vue.
  - résumé → `SummaryReadLink` (au clic, avant d'ouvrir le fichier) →
    `markSummaryReadAction`. Vaut partout où le fichier est ouvert (liste du
    cours **et** zone de la classe).
  - **« Tout marquer comme lu »** sur chaque zone de classe →
    `markAllClass{Questions,Summaries}ReadAction` (insère les lignes `*_reads`
    pour tout ce qui est actuellement nouveau).
- Plus aucun marquage automatique à l'ouverture d'une **liste**
  (`/course/[id]/questions`, `/course/[id]/summaries`, les zones de classe).
- Helpers dans `features/reads/` : `queries.ts` (`memberSinceByCourse`,
  `readQuestionIds`, `readSummaryIds`), `actions.ts`. `countNewQuestions` /
  `countNewSummaries` (`features/courses/queries.ts`) et
  `getClassNew{Questions,Summaries}` réécrits dessus.
- Tolérant : si `0021` n'est pas appliquée, la lecture de `question_reads` /
  `summary_reads` échoue ⇒ « aucune nouveauté » (jamais « tout est nouveau »).

## Alternatives écartées

- **Garder le curseur mais ne l'avancer qu'au départ de la page** : fragile
  (quel événement ? navigation SPA ?), et ne règle pas « j'ai lu A mais pas
  B ».
- **Un seul curseur + un bouton « marquer lu »** (sans suivi par élément) :
  ne permet pas « la question que j'ai ouverte disparaît, les autres
  restent ».
- **Marquer lu au survol / après X secondes** : trop implicite.

## Conséquences

- Une ligne par (élément, utilisateur) ouvert. Volume raisonnable à
  l'échelle d'une classe ; `on delete cascade` nettoie si l'élément part.
- Ouvrir une question **depuis n'importe où** (carte de liste, zone
  nouveautés, lien de notif) la marque lue — cohérent.
- `0022` reste la référence pour tout le reste (UI, couleurs, zones).
- **Page `/nouvelles`** (agrégat « mes nouveautés », tous cours confondus —
  classes + perso) : `getMyNewQuestions()` / `getMyNewSummaries()`
  (`features/classes/queries`, cœur partagé `collectNew*` ; `CourseMeta`
  = nom du cours + nom de la classe parente, `null` si cours perso),
  `markAllMy{Questions,Summaries}ReadAction`. La liste est **regroupée par
  classe puis par cours** (`groupByClassCourse` dans la page) : une liste
  à plat mélangeant français / math / géo ne veut rien dire. En-tête de
  classe seulement s'il y a > 1 classe ; en-tête de cours toujours. Le
  récap du tableau de bord y renvoie (`/nouvelles#questions` / `#resumes`)
  au lieu de seulement annoncer un compte.
- **Piège PostgREST** : `question_reads` / `summary_reads` ajoutent un 2ᵉ
  chemin `questions`↔`profiles` et `summaries`↔`profiles`. Les embeds
  `profiles(...)` sur `questions` deviennent ambigus (PGRST201) → il faut
  `profiles!questions_author_id_fkey(...)` partout (`QUESTION_SELECT`,
  `getClassNewQuestions`). Corrigé après coup.
- Le revirement est assumé : `0022` avait préféré le curseur « pour ne pas
  cocher » ; l'usage a montré que le coût réel est de **perdre** les
  nouveautés avant de les avoir vues.
