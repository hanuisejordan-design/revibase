# 0022 — Nouvelles questions depuis la dernière visite

- Statut : accepté
- Date : 2026-08-31
- Voir aussi : [0021](0021-notifications.md), [0008](0008-questions.md)

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
- **« Nouvelle »** = `question.created_at > course_reads.seen_at` (jamais
  visité ⇒ tout est nouveau), hors les questions de l'utilisateur, hors
  supprimées.
- **`seen_at` remis à maintenant** quand on ouvre la liste des questions d'un
  cours (`MarkCourseSeen`, effet client → `markCourseQuestionsSeenAction`) ou
  la zone « nouvelles questions » de la classe (`MarkClassSeen` →
  `markClassQuestionsSeenAction`, upsert pour chaque cours de la classe).
  Même principe que « ouvrir /notifications = tout lu » : le rendu courant
  montre encore le neuf, la base est à jour pour la visite suivante.
- **Comptage** : `countNewQuestions(supabase, userId, courseIds)` →
  `Map<courseId, number>`, branché dans `getMyClasses` / `getClassCourses` /
  `getMyCourses`. `CourseSummary.newQuestionCount` ;
  `ClassSummary.newQuestionCount` = somme sur les cours.
- **Affichage** :
  - vignette de cours (tableau de bord, page classe) : pastille ambre
    « N nouvelles » ;
  - vignette de classe : idem, somme sur les cours ;
  - page de la classe : encart ambre au-dessus de « Créer un cours »,
    « N nouvelles questions depuis ta dernière visite → Les parcourir » ;
  - zone `class/[classId]/nouvelles` : la liste agrégée de tous les cours,
    **de la plus ancienne à la plus récente** (pour les enchaîner dans
    l'ordre), chaque ligne → la question dans son cours.
- Si `0018` n'est pas encore appliquée, les requêtes détectent l'erreur de
  lecture et renvoient « aucune nouvelle » (pas « tout est nouveau »).

## Alternatives écartées

- **Notification `new_question`** : cf. contexte — mauvais canal.
- **Un `seen_at` global par utilisateur** (pas par cours) : impossible de
  dire quel cours a du neuf ; on veut la pastille par vignette.
- **Marquer vu au niveau de chaque question** (comme « lu / non lu » par
  question) : beaucoup de lignes, et l'utilisateur ne veut pas cocher. Un
  seul curseur temporel par cours suffit.
- **Mode « une par une » plein écran** pour enchaîner : repoussé — la liste
  ordonnée suffit pour commencer (cf. backlog).

## Conséquences

- Ouvrir la liste des questions d'un cours « consomme » le neuf de ce cours,
  même sans le lire en détail — accepté (comme /notifications).
- `course_reads` ne référence pas `class_members` : un membre qui a accès à
  un cours via sa classe a quand même son propre curseur par cours.
- Le compteur se rafraîchit à la navigation (pages dynamiques) ; pas de
  temps réel, cohérent avec [0021](0021-notifications.md).
- Une question supprimée après coup disparaît du compteur et de la liste
  (`deleted_at is null` partout).
