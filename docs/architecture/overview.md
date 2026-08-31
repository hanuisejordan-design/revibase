# Vue d'ensemble de l'architecture

> **Vocabulaire (Phase 15, ADR 0017)** : ce qui est appelé « groupe » dans les
> sections ci-dessous est désormais une **classe** (table `classes`,
> `class_members`, routes `/class/*`) ; ce qui est appelé « classe » est
> désormais un **cours** (table `courses`, `course_members`, routes
> `/course/*`, colonnes `*.course_id`). Hiérarchie : classe → cours →
> chapitre → question. Les fonctions RLS suivent : `is_class_member` (niveau
> classe), `is_course_member` / `is_course_trainer` (niveau cours).

## Objectif

Structurer et capitaliser les connaissances produites par une classe. Une
question est un **objet permanent** : rattachée à une classe et à un chapitre,
elle porte des réponses, un fil de discussion, des votes, un statut de
validation, et peut alimenter des quiz.

## Stack

- **Next.js 16 (App Router)** — rendu serveur, Server Components pour les
  lectures, Server Actions pour les écritures.
- **Supabase** — PostgreSQL managé, authentification, et surtout **Row Level
  Security** : les règles d'accès vivent dans la base.
- **TypeScript strict**, **Zod** pour la validation des entrées.
- **Tailwind CSS v4** — mobile-first.

## Couches et responsabilités

```
Composant (app/, components/)
        │  props / appel d'action
        ▼
features/<domaine>/actions.ts   (écritures + permissions)
features/<domaine>/queries.ts   (lectures)
        │
        ▼
lib/supabase/{server,client}.ts  →  Supabase  →  PostgreSQL + RLS
```

- `app/` et `components/` **ne touchent jamais** la base directement.
- `features/<domaine>/` : `schema.ts` (Zod), `queries.ts` (lecture, en Server
  Component), `actions.ts` (Server Actions : valident, vérifient les
  permissions, écrivent), `types.ts` si nécessaire.
- `services/` : logique transverse (génération de quiz, notifications).
- `lib/` : clients Supabase, helpers d'auth, validation partagée, `env.ts`
  (validation des variables d'environnement via Zod), `utils/`.

## Modèle de données (MVP)

```
profiles                (1-1 avec auth.users)
classes ──< class_members >── profiles          (role: student | trainer)
classes ──< chapters
classes ──< questions >── chapters (nullable)
              │  kind: open | mcq
              ├──< answers ──< answer_votes
              │       accepted (auteur) · validated_by (formateur)
              ├──< comments                       (le fil de discussion)
              └──< question_options               (réservé mcq, Phase 8)
classes ──< quizzes ──< quiz_questions >── questions
quizzes ──< quiz_attempts ──< quiz_answers
profiles ──< notifications                        (Phase 21 : triggers + UI)
```

Détails : [`../decisions/0002-modele-donnees.md`](../decisions/0002-modele-donnees.md).
Schéma exécutable : [`../../supabase/migrations/0001_initial_schema.sql`](../../supabase/migrations/0001_initial_schema.sql).

### Statut d'affichage d'une réponse

Calculé à la lecture, par priorité décroissante :

1. **Validée formateur** — `validated_by` renseigné.
2. **Retenue par l'auteur** — `accepted = true`.
3. **Réponse communautaire** — plus grand nombre de votes (> 0).
4. **Non vérifiée** — aucune des conditions précédentes.

## Sécurité

- **RLS activée sur toutes les tables.** Un utilisateur ne voit que les
  données des classes dont il est membre. Impossible d'accéder à une autre
  classe en changeant un identifiant dans l'URL ou la requête.
- Fonctions d'aide `security definer` : `is_class_member(class)`,
  `is_class_trainer(class)`, `question_class(q)`, `answer_class(a)`.
- Règles métier appliquées **en base** quand c'est critique : seul un
  `trainer` de la classe peut renseigner `answers.validated_by` (trigger).
- Opérations atomiques via RPC `security definer` : `create_class()`,
  `join_class_by_code()`.
- Défense en profondeur : les Server Actions revérifient l'appartenance et le
  rôle avant d'écrire. Les contrôles d'interface ne sont jamais considérés
  comme suffisants.
- Privilèges au niveau table accordés à `authenticated` / `service_role`
  (migration 0001 §12 / correctif 0003) ; la RLS reste le filtre fin.

## Authentification (Phase 1)

- **Supabase Auth** (e-mail + mot de passe). L'inscription passe le nom dans
  `options.data.display_name` ; un trigger `handle_new_user` crée la ligne
  `profiles` correspondante.
- **`src/proxy.ts`** (ex-`middleware`, renommé en Next.js 16) rafraîchit la
  session à chaque requête via `@supabase/ssr`.
- **DAL** — `src/lib/auth/dal.ts` : `getUser()` (session revérifiée par
  `supabase.auth.getUser()`, mémoïsée avec `cache()`) et `requireUser()`
  (redirige vers `/login`). Appelés en tête des layouts protégés.
- Groupes de routes : `(auth)` (public, redirige les connectés vers
  `/dashboard`) et `(app)` (garde `requireUser()`).
- Server Actions `signUpAction` / `signInAction` / `signOutAction` dans
  `src/features/auth/actions.ts` ; validation Zod dans `schema.ts` ; erreurs
  traduites en français, jamais l'erreur brute.

## Classes (Phase 2)

- `src/features/classes/` : `schema.ts` (Zod), `queries.ts`
  (`getMyClasses`, `getClassContext`, `getClassMembers`), `actions.ts`
  (`createClassAction`, `joinClassAction`, `leaveClassAction`),
  `types.ts` (projections locales, faute de types générés Supabase).
- Création / adhésion via les RPC `security definer` `create_class()` et
  `join_class_by_code()` (atomiques : classe + adhésion + chapitres).
- **Isolation** : `class/[classId]/layout.tsx` appelle `getClassContext()` ;
  si l'utilisateur n'est pas membre → `notFound()`. La RLS garantit qu'aucune
  donnée d'une autre classe n'est lisible.
- `getMyClasses()` filtre sur `user_id = auth.uid()` (la RLS de
  `class_members` laisse voir tous les co-membres) et expose `groupId`.
- `getClassContext()` s'appuie sur la RLS de `classes` pour la visibilité
  (accès direct **ou** via le groupe) et expose `groupId` / `groupName` /
  `isExplicitMember`.
- Page `not-found.tsx` en français à la racine.

## Groupes (Phase 13, ADR 0015)

- Un `groupe` chapeaute des classes. Membre du groupe = accès à **toutes**
  ses classes, sans ligne `class_members`. Migration `0009_groups.sql`.
- Tables `groups` / `group_members` (`is_admin`), `classes.group_id`
  nullable. Aides RLS `is_group_member` / `is_group_admin` ;
  `is_class_member(class_id)` étendu : ligne `class_members` **OU** membre du
  groupe propriétaire (ajout additif — classe sans groupe inchangée).
- `src/features/groups/` : `schema`, `types`, `queries` (`getMyGroups`,
  `getGroupContext`, `getGroupClasses`, `getGroupMembers`), `actions`
  (`createGroupAction`, `joinGroupAction`, `leaveGroupAction`). RPC
  `create_group` / `join_group_by_code` ; `create_class` gagne `p_group_id`.
- Routes `group/new`, `group/join`, `group/[groupId]` (classes + code +
  membres), `group/[groupId]/class/new` (admin). Le tableau de bord affiche
  les classes groupées sous leur groupe, puis « Autres classes » ;
  `class/[classId]/layout` remonte vers le groupe s'il y en a un.
- Rôle : membre par le groupe = `student` ; « formateur » reste une ligne
  `class_members`. Admin de groupe ≠ formateur de classe.
- `CourseCard` (tableau de bord, page classe) affiche « N questions · N
  résumés · N membres » + badge « Formateur » si le viewer l'est (plus de
  badge « Admin »). Compteurs via `countCourseContent()`
  (`features/courses/queries.ts`), réutilisé par `getMyCourses`,
  `getMyClasses`, `getClassCourses`.
- Nav (après Phase 15/16) : fil d'Ariane (`← parent`) + **nom cliquable**
  (retour à l'accueil). Un **cours** a un menu compact
  `Questions · Résumés · Paramètres` (= les vues « liste complète ») ; une
  **classe** juste un lien `Paramètres`. Les **actions** sont des boutons sur
  l'accueil : cours → « Poser une question » + « Ajouter un résumé » +
  « Faire un quiz » ; classe → « Créer un cours ». L'accueil d'un cours
  montre en plus « Questions récentes » et « Résumés récents » (aperçu + « Voir
  tout »). Code d'invitation + membres d'une classe sont dans `settings`.

## Chapitres (Phase 3)

- `src/features/chapters/` : `schema.ts`, `queries.ts` (`listChapters`),
  `actions.ts` (`createChapter`, `renameChapter`, `moveChapter`,
  `deleteChapter`). Chaque action revérifie l'appartenance à la classe via
  `getClassContext` avant d'écrire (la RLS `chapters_*_member` est la seconde
  barrière).
- **Tout membre** gère les chapitres (ADR 0007) depuis
  `class/[classId]/settings` : ajouter / renommer / réordonner (échange de
  `position`) / supprimer.
- Supprimer un chapitre laisse ses questions (`chapter_id` → `NULL` via
  `ON DELETE SET NULL`) ; message d'avertissement dans l'UI.

## Questions (Phase 4)

- `src/features/questions/` : `schema.ts`, `types.ts`, `queries.ts`
  (`listQuestions`, `getRecentQuestions`, `getQuestion`), `actions.ts`
  (`createQuestionAction`, `updateQuestionAction`, `deleteQuestionAction`).
- Routes : `course/[courseId]/questions` (liste — filtre chapitre, recherche
  `ILIKE` titre, tri récent/sans réponse/populaire, tout via `searchParams`),
  `.../questions/new` (formulaire), `.../questions/[questionId]` (détail),
  `.../questions/[questionId]/edit` (**Phase 19, ADR 0020** — auteur ou
  formateur ; `QuestionForm` avec prop `initial` ; titre / contexte /
  chapitre / options / photo modifiables, **type figé**).
- Statut d'une question = `validated` / `answered` / `unanswered`, calculé
  depuis `answers` (2 requêtes de comptage par lot d'ids).
- **Suppression douce** (`deleted_at`) par l'auteur ou un formateur ; les
  lectures filtrent `.is('deleted_at', null)`. La RLS `questions_select_member`
  ne porte QUE sur l'appartenance à la classe (sinon l'UPDATE de suppression
  casse — cf. ADR 0008).
- L'accueil de classe est orienté questions ; code d'invitation + participants
  déplacés dans `settings`.

## Réponses & votes (Phase 5)

- `src/features/answers/` : `queries.ts` (`listAnswers` — tri validée >
  retenue > votes > ancienneté), `actions.ts` (`createAnswerAction`,
  `toggleVoteAction`, `toggleAcceptAction`, `deleteAnswerAction`).
- Vote = ligne `answer_votes` (unique par personne) ; `toggleVoteAction`
  insère/supprime.
- Badge par réponse : `validated` / `accepted` / `community` / `unverified`.
- « Retenir » une réponse passe par le RPC `security definer`
  `accept_answer(p_answer)` (migration 0006) : l'auteur de la question ne
  peut pas faire l'UPDATE direct (RLS `answers_update_author_or_trainer`).
- La page question affiche désormais la liste des réponses + le formulaire.

## Discussions (Phase 6)

- `src/features/discussions/` : `queries.ts` (`listComments`, chronologique),
  `actions.ts` (`createCommentAction`, `deleteCommentAction`).
- Fil plat par question (`comments`), sans vote ni statut. Suppression par
  l'auteur du message ou un formateur.
- La page question distingue « Réponses » (tentatives de réponse) et
  « Discussion » (échange autour de la question).

## Validation formateur (Phase 7)

- `toggleValidateAction` (`features/answers/actions.ts`), garde
  `ctx.role === 'trainer'` ; `ValidateButton` visible aux seuls formateurs.
- Aucune nouvelle brique d'autorisation : la RLS
  `answers_update_author_or_trainer` + le trigger `enforce_answer_validation`
  imposent « seul un formateur pose `validated_by` » et forcent
  `validated_by = auth.uid()` / `validated_at`.
- Migration 0007 : durcissement du trigger — retirer une validation existante
  exige aussi d'être formateur (sinon l'auteur de la réponse pouvait la
  retirer via l'API).

### Rôles d'un cours (Phase 18, ADR 0019)

- `course_members` porte deux choses **indépendantes** : `is_admin`
  (gestion : code, membres, attribution des rôles) et `role`
  (`student` / `trainer` — `trainer` = valide les réponses). Migration
  `0014` : colonne `is_admin`, backfill des `trainer` actuels,
  `create_course` pose `is_admin = true` (créateur = admin) ; case « Je suis
  le formateur de ce cours » (`p_is_trainer`, décochée par défaut) → `role =
  'trainer'` direct.
- `is_course_admin()` + policy `UPDATE` sur `course_members` réservée aux
  admins ; `setCourseAdminAction` / `setCourseTrainerAction` (refus de
  retirer le dernier admin). UI : `CourseMemberManager` dans les paramètres
  du cours. `getCourseContext` renvoie `isAdmin`.
- La **classe** garde `class_members.is_admin` ; pas de formateur au niveau
  classe.

## Quiz (Phase 8)

- `services/quiz-generator/` : tire N questions (filtre chapitre, priorité aux
  questions ayant une réponse de référence).
- `src/features/quizzes/` : `schema.ts`, `types.ts`, `queries.ts`
  (`getRunnerData`, `getResult`, `listMyAttempts`), `actions.ts`
  (`createQuizAction`, `submitQuizAction`, `retakeQuizAction`).
- Routes : `class/[classId]/quiz` (créer + mes quiz récents),
  `class/[classId]/quiz/[attemptId]` (passage ou résultat selon
  `completed_at`).
- Mode auto-évaluation (ADR 0003) : `QuizRunner` (client), état local, envoi
  groupé des résultats en fin de quiz. Réponse de référence = validée >
  retenue > la plus votée.
- Score = nombre de « je savais » ; questions à revoir = « à revoir ».
- Aucune migration (tables `quiz*` et RLS déjà dans 0001).

## Types de question (Phase 11)

- `questions.kind` : `open` | `true_false` | `mcq` ; `true_false` / `mcq`
  utilisent `question_options` (`is_correct`, `position`), gérables par tout
  membre (migration 0008).
- Formulaire : sélecteur de type + éditeur d'options (une seule bonne
  réponse). `createQuestionAction` insère question + options (rollback si
  échec).
- Page question : `open` → réponses/votes/validation ; `true_false` / `mcq` →
  options (bonne en vert) ; Discussion dans les deux cas.
- Quiz : `QuizRunner` branche par type — options cliquables + retour
  rouge/vert pour les QCM, révélation + auto-évaluation pour les ouvertes.
  Le score des QCM est **recalculé côté serveur** dans `submitQuizAction`
  (`question_options.is_correct` d'après `selected_option_id`).
- Page question : la page d'une QCM / vrai-faux est **interactive**
  (`QuestionOptionsView`, client) — on choisit une option, retour rouge/vert.
  Rien n'est enregistré (l'entraînement répété se fait en mode quiz). La
  discussion s'affiche en **bulles** (`CommentList` : à moi = aligné à droite,
  foncé ; autre = à gauche, clair).

## Répondre avant de voir + fusion des doublons (Phase 12, ADR 0014)

- **Question ouverte** : tant qu'on n'a pas participé (répondu / voté /
  fusionné), les réponses des autres sont masquées derrière
  `AnswerReveal` (client) ; le formulaire passe au-dessus. Échappatoire
  « Voir les N réponses sans répondre ».
- `normalize.ts` (`normalizeAnswerBody`, `isSameAnswer`, testé) : `trim`,
  minuscules, espaces réduits, ponctuation de fin retirée — accents et fautes
  conservés.
- `createAnswerAction` : correspondance **exacte** avec une réponse existante
  → pas de doublon, un vote de l'auteur est ajouté (`answer_votes`, upsert
  ignore-duplicates) et l'UI affiche « ta réponse rejoignait celle de X » ;
  sinon la réponse est créée **et l'auteur vote automatiquement**.
- Le compteur = « N personnes donneraient cette réponse ». **Vote anonyme** :
  `listAnswers` ne renvoie que `voteCount` + `viewerHasVoted`, pas les noms
  des votants.
- `VoteButton` = **pastille 👍 compacte** (« 👍 N » / « 👍 Moi aussi », pleine
  si soutenue), positif uniquement + phrase d'aide dans `AnswerList`.
- Aucune migration.

## Photo sur une question (Phase 14, ADR 0016)

- `questions.image_path` (une image) ; bucket Storage **privé**
  `question-images`, chemin `{class_id}/{uuid}.jpg`. Policies
  `storage.objects` = membre de la classe (via `storage.foldername`).
  Migration `0010_question_images.sql`.
- Upload **côté client, à la publication** : `lib/images/downscale.ts`
  (canvas → JPEG ~1600 px) puis `supabase.storage.upload` ; le formulaire
  passe seulement le chemin à `createQuestionAction`, qui vérifie le préfixe
  `{classId}/` et nettoie l'image si l'insert échoue.
- Affichage par **URL signée** (~1 h) générée dans `queries` :
  `signImages()` (`createSignedUrls` en lot) pour `listQuestions` /
  `getQuestion` ; `getRunnerData` signe aussi. Rendu : vignette sur
  `QuestionCard`, image cliquable sur la page détail, image dans le
  `QuizRunner`.

## Résumés par cours (Phase 16, ADR 0018)

- `summaries` (`course_id`, `chapter_id` nullable, `author_id`, `title`,
  `file_path`, `file_name`) ; RLS : lecture/ajout = `is_course_member`,
  suppression = auteur ou `is_course_trainer`. Bucket Storage privé
  `summaries`, chemin `{course_id}/{uuid}.ext`, mêmes policies que
  `question-images`. Migration `0012_summaries.sql`.
- `features/summaries` : `listSummaries` (URL signées, type image/pdf/other
  déduit de l'extension, `canDelete`), `createSummaryAction` /
  `deleteSummaryAction` (nettoient le fichier Storage).
- Upload côté client au submit (sans redimensionnement, max 20 Mo) sur une
  page dédiée `course/[courseId]/summaries/new` ; `createSummaryAction`
  redirige vers la liste. La page `summaries` = `SummaryList` (liste compacte
  groupée par chapitre, **toute la ligne cliquable** = `<a>` vers l'URL
  signée, « Supprimer » à part) + un bouton « Ajouter un résumé ».
- **Favori privé (Phase 17, migration `0013`)** : `summary_pins
  (summary_id, user_id)`, RLS `user_id = auth.uid()` (strictement privé).
  Étoile ☆/★ par ligne (`toggleSummaryPinAction`), `listSummaries` renvoie
  `pinned` ; case « Mes favoris uniquement » = paramètre `?favoris=1` filtré
  côté serveur.

## Flux d'une requête authentifiée

1. `src/proxy.ts` rafraîchit la session Supabase (cookies).
2. Le layout `(app)` appelle `requireUser()` → redirection si non connecté.
3. Le Server Component appelle `features/*/queries.ts` avec le client serveur.
4. PostgreSQL applique la RLS selon `auth.uid()`.
5. Les mutations passent par une Server Action → validation Zod → RPC ou
   `insert/update` → la RLS et les triggers refont respecter les règles.

## Centre de notifications (Phase 21, ADR 0021)

- **Écriture = triggers `security definer`** (migration `0016`), pas les
  Server Actions : impossible à oublier, et ça contourne l'absence voulue de
  policy INSERT sur `notifications`.
  - `notify_on_answer` — `AFTER INSERT` sur `answers` → l'auteur de la
    question (`type = 'answer'`).
  - `notify_on_comment` — `AFTER INSERT` sur `comments` → l'auteur de la
    question (`type = 'comment'`).
  - `notify_on_validation` — `AFTER UPDATE` sur `answers`, quand
    `validated_by` passe à non-nul → l'auteur de la réponse
    (`type = 'validation'`).
  - Jamais de notification à soi-même (`actor_id <> user_id`).
  - Réservé aux **échanges** : « nouvelle question dans un cours » est traité
    à part (`course_reads`, cf. section suivante et ADR 0022).
- `features/notifications/` : `queries.ts` (`listNotifications` — 50
  dernières, jointure `actor:profiles` + `questions` ; `countUnreadNotifications`
  — `read_at is null`, pour la cloche), `actions.ts`
  (`markAllNotificationsReadAction`).
- **UI** : cloche 🔔 + compteur non-lus dans l'en-tête `(app)`
  (Server Component, rafraîchi à chaque navigation — ni realtime ni push) →
  page `/notifications` (liste, ligne teintée si non lue, lien vers la
  question, « Tout marquer comme lu »). **Ouvrir la page marque tout lu**
  (`MarkAllRead`, effet client au montage).
- `services/notifications/` reste vide — la logique est en base + `features/`.

## Nouveautés depuis la dernière visite (Phase 22 + 24, ADR 0022 / 0024)

- **Suivi de lecture par élément** (ADR 0024, migration `0021`) :
  `question_reads (question_id, user_id)` et `summary_reads (summary_id,
  user_id)`, privées. Remplace le curseur horodaté `course_reads`
  (migrations 0018/0019, table **supprimée** par 0021).
- **« Nouveau »** pour l'utilisateur = créé après son arrivée
  (`memberSinceByCourse` = min de `course_members.joined_at` /
  `class_members.joined_at`), pas de lui, non supprimé, **et pas dans
  `*_reads`**. Ouvrir une **liste** ne marque plus rien.
- **Marquage** (seulement à l'ouverture réelle) : `MarkQuestionRead` (effet,
  page détail) ; `SummaryReadLink` (au clic sur le fichier, partout) ;
  boutons « Tout marquer comme lu » des zones de classe. Actions dans
  `features/reads/actions.ts` (`markQuestionReadAction`,
  `markSummaryReadAction`, `markAllClass{Questions,Summaries}ReadAction`).
- Helpers `features/reads/queries.ts` (`memberSinceByCourse`,
  `readQuestionIds`, `readSummaryIds`). `countNewQuestions()` /
  `countNewSummaries()` (`features/courses/queries.ts`) alimentent
  `CourseSummary.newQuestionCount` / `.newSummaryCount` ; les
  `ClassSummary.*` sont les sommes.
- **UI** : deux couleurs — **ambre** questions, **vert (emerald)** résumés.
  Pastilles sur les vignettes de cours et de classe ; deux encarts sur la
  page de la classe → zones `class/[classId]/nouvelles` (`getClassNewQuestions`)
  et `class/[classId]/nouveaux-resumes` (`getClassNewSummaries`), listes
  agrégées tous cours, la plus ancienne d'abord.
- Requêtes tolérantes : si `0021` non appliquée, l'erreur de lecture de
  `question_reads` / `summary_reads` ⇒ « aucune nouveauté ».

## PWA + notifications push (Phase 23, ADR 0023)

- **PWA** : `app/manifest.ts` (`display: standalone`, icônes `public/`
  générées par `scripts/gen-icons.mjs`). Service worker `public/sw.js` —
  **push uniquement**, pas de cache offline (`push` → `showNotification`,
  `notificationclick` → focus/ouvre l'URL). En-têtes dans `next.config.ts`.
- **Web Push** : clés VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` client,
  `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` serveur) — **optionnelles**, absentes
  ⇒ push désactivé proprement.
- **Migration `0020`** : `push_subscriptions` (un appareil = une ligne, clé
  `endpoint`), privée. `security definer` : `list_push_targets(uuid[])` (lire
  les abonnements des destinataires), `delete_push_subscription_by_endpoint`
  (purge 404/410).
- `features/push/` : `actions.ts` (`subscribeToPushAction` /
  `unsubscribeFromPushAction`), `audience.ts` (`courseAudience` =
  `course_members` ∪ `class_members`). `lib/push/send.ts`
  (`sendPushToUsers`, best-effort, `web-push`).
- `components/notifications/push-toggle.tsx` en tête de `/notifications` :
  enregistre le SW, permission, `pushManager.subscribe`, Activer/Désactiver.
- **Envoi depuis les Server Actions** dans un `after()` (non bloquant) :
  `createAnswerAction` / `createCommentAction` / `toggleValidateAction` →
  auteur concerné ; `createQuestionAction` / `createSummaryAction` →
  `courseAudience`. La notif in-app (triggers) + les pastilles `course_reads`
  restent la source de vérité ; le push est une couche de livraison.
- **iOS** : push seulement si l'app est installée sur l'écran d'accueil
  (16.4+). Un encart l'explique dans `PushToggle`.
