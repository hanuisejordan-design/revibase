# 0022 — Nouveautés depuis la dernière visite (questions & résumés)

- Statut : accepté — **mécanisme de « vu » remplacé par [0024](0024-lecture-par-element.md)**
  (suivi par élément au lieu du curseur `course_reads`). Le reste (vignettes,
  zones, code couleur) reste valable.
- Date : 2026-08-31
- Voir aussi : [0021](0021-notifications.md), [0008](0008-questions.md),
  [0018](0018-resumes-par-cours.md)

## Contexte

Le [centre de notifications](0021-notifications.md) prévient quand **on agit
sur ton contenu** (réponse, commentaire, validation). Il ne dit pas « il y a
des questions que tu n'as pas encore vues » — or c'est le cœur de l'usage :
arriver dans sa classe et voir tout de suite ce qui est apparu.

On avait d'abord tenté une notification `new_question` (ancien `0017`,
abandonné avant application) : une ligne par membre et par question, et ça
mélangeait deux natures de signal. « Nouvelle question » n'est pas un
événement adressé à quelqu'un, c'est un **état de lecture**.

## Décision

**Un marqueur de lecture par (cours, utilisateur)**, pas une notification.

- **Migration `0018`** : table `course_reads (course_id, user_id, seen_at)`,
  clé primaire `(course_id, user_id)`, strictement privée
  (RLS `user_id = auth.uid()`, comme `summary_pins`).
- **Migration `0019`** : le principe vaut aussi pour les résumés →
  `seen_at` renommé `questions_seen_at`, colonne `summaries_seen_at` ajoutée.
  Un `course_reads` porte donc **deux curseurs** par (cours, utilisateur).
- **« Nouveau »** = `created_at > le curseur correspondant` (jamais visité ⇒
  tout est nouveau), hors ce que l'utilisateur a lui-même écrit, hors
  questions supprimées.
- **Curseur remis à maintenant** à l'ouverture de la liste concernée :
  - questions d'un cours → `MarkCourseSeen` → `markCourseQuestionsSeenAction`
  - résumés d'un cours → `MarkSummariesSeen` → `markCourseSummariesSeenAction`
  - zone questions de la classe → `MarkClassSeen` →
    `markClassQuestionsSeenAction` (upsert `questions_seen_at` par cours)
  - zone résumés de la classe → `MarkClassSummariesSeen` →
    `markClassSummariesSeenAction` (upsert `summaries_seen_at` par cours)

  Chaque action fait un `upsert` partiel : elle ne touche que son curseur,
  l'autre est préservé. Même principe que « ouvrir /notifications = tout
  lu » : le rendu courant montre encore le neuf, la base est à jour pour la
  visite suivante.
- **Comptage** : `countNewQuestions()` / `countNewSummaries()`
  (`features/courses/queries.ts`) → `Map<courseId, number>`, branchés dans
  `getMyClasses` / `getClassCourses` / `getMyCourses`.
  `CourseSummary.newQuestionCount` + `.newSummaryCount` ; les
  `ClassSummary.*` sont les sommes sur les cours.
- **Affichage** — deux couleurs pour distinguer les deux natures :
  **ambre** = questions, **vert (emerald)** = résumés.
  - vignettes de cours et de classe : pastille ambre « N nouvelles
    questions » et pastille verte « N nouveaux résumés » ;
  - page de la classe : deux encarts au-dessus de « Créer un cours » —
    ambre « N nouvelles questions… → Les parcourir » vers
    `class/[classId]/nouvelles`, vert « N nouveaux résumés… → Les
    parcourir » vers `class/[classId]/nouveaux-resumes` ;
  - `class/[classId]/nouvelles` : liste agrégée des nouvelles questions de
    tous les cours, **de la plus ancienne à la plus récente** (pour les
    enchaîner), chaque ligne → la question dans son cours ;
  - `class/[classId]/nouveaux-resumes` : idem pour les résumés
    (`getClassNewSummaries`, URL signées via `signSummaryFiles`), chaque
    ligne → le fichier (nouvel onglet).
- Si `0018`/`0019` ne sont pas encore appliquées, les requêtes détectent
  l'erreur de lecture et renvoient « aucune nouveauté » (jamais « tout est
  nouveau »).

## Alternatives écartées

- **Notification `new_question`** : cf. contexte — mauvais canal.
- **Un `seen_at` global par utilisateur** (pas par cours) : impossible de
  dire quel cours a du neuf ; on veut la pastille par vignette.
- **Un seul curseur pour questions + résumés** : ouvrir l'onglet Questions
  éteindrait la pastille Résumés. Deux curseurs, deux listes.
- **Marquer vu au niveau de chaque question** (comme « lu / non lu » par
  question) : beaucoup de lignes, et l'utilisateur ne veut pas cocher. Un
  seul curseur temporel par cours suffit.
- **Mode « une par une » plein écran** pour enchaîner : repoussé — la liste
  ordonnée suffit pour commencer (cf. backlog).

## Conséquences

- Ouvrir une liste (Questions ou Résumés) « consomme » le neuf de ce cours
  pour ce type, même sans le lire en détail — accepté (comme /notifications).
- `course_reads` ne référence pas `class_members` : un membre qui a accès à
  un cours via sa classe a quand même son propre curseur par cours.
- Le compteur se rafraîchit à la navigation (pages dynamiques) ; pas de
  temps réel, cohérent avec [0021](0021-notifications.md).
- Une question supprimée après coup disparaît du compteur et de la liste
  (`deleted_at is null` partout).
