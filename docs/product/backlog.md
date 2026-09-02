# Backlog

Idées et reports notés au fil de l'usage. Rien ici n'est engagé — on
priorise selon les retours de la classe.

## Prochaines fonctionnalités (demandées)

### ✅ Renommage groupe → classe → cours + refonte tableau de bord — fait (Phase 15, ADR 0017)

Vocabulaire aligné (base incluse, migration `0011` en `RENAME`). Tableau de
bord : action principale = rejoindre / créer une **classe** ; les **cours** se
créent dedans ; cours autonome possible en secondaire.

### ✅ Résumés par cours — fait (Phase 16, ADR 0018)

Onglet « Résumés » : un fichier + un titre + chapitre optionnel, bucket privé,
suppression auteur/formateur.

Suites (arbitrées avec l'utilisateur) :

- **Favori privé** (« épingler ») à la place d'un « 👍 utile » public :
  **fait — Phase 17** (migration `0013`). Table `summary_pins
  (summary_id, user_id)` strictement privée (RLS `user_id = auth.uid()`),
  étoile ☆/★ par ligne, case « Mes favoris uniquement » (`?favoris=1`). Un
  compteur agrégé public reste possible plus tard si le collectif se
  confirme.
- **Éditeur de texte dans l'app** (`summaries.body` markdown) : **écarté** —
  ce n'est pas le rôle de l'app, d'autres outils le font mieux.
- **Plusieurs fichiers par résumé** (`summary_files`) : *peut-être utile*
  (doc scanné multi-pages, PDF + annexes). Pas prioritaire.

### ✅ Rôles du cours : admin ≠ formateur — fait (Phase 18, ADR 0019)

`course_members.is_admin` (gestion) séparé de `role` student/trainer
(pédagogie, valide les réponses). Créateur = admin, plus formateur d'office ;
un admin attribue « formateur ». Migration `0014`.

### ✅ Éditer une question — fait (Phase 19, ADR 0020)

Modifier titre / contexte / chapitre / options / photo (auteur ou formateur).
Type non modifiable. Pas de migration (RLS déjà en place).

### ✅ Nouveautés depuis la dernière visite — fait (Phase 22, ADR 0022 ; mécanisme revu Phase 24, ADR 0024)

Suivi de lecture **par élément** (`question_reads` / `summary_reads`,
migration `0021`, privé — remplace le curseur `course_reads` de 0018/0019).
Un élément ne quitte les « nouveautés » que quand on l'a **réellement
ouvert** ; ouvrir une liste ne marque plus rien. Plancher « rien d'avant mon
arrivée » via `joined_at`. Bouton « Tout marquer comme lu » sur les zones de
classe. Deux couleurs : **ambre** questions, **vert** résumés. Pastilles sur
les vignettes cours/classe ; deux encarts sur la page de la classe → zones
`class/[classId]/nouvelles` et `class/[classId]/nouveaux-resumes`. L'ancien
trigger de notification `new_question` (`0017`) est abandonné : une nouveauté
n'est pas un événement adressé, c'est un état de lecture.

Reste éventuel : mode « une par une » plein écran (bouton « suivante → »).
Pas prioritaire.

- **Idée** : savoir ce qui est apparu depuis qu'on est passé.
  - Vignettes (tableau de bord) : badge « N nouvelles questions » par cours,
    additionné sur la vignette de la classe.
  - Accueil du cours : section « Nouvelles questions (N) » en haut si N > 0.
  - Les **enchaîner** : d'abord un simple filtre « Nouvelles » sur la page
    Questions (comme « Sans réponse ») ; un mode « une par une » plein écran
    seulement si le besoin se confirme.
- **À faire** : table `course_reads (course_id, user_id,
  questions_seen_at)` (RLS `user_id = auth.uid()`), mise à jour à l'ouverture
  de la liste des questions ; « nouvelle » = `question.created_at >
  questions_seen_at` (pas les siennes, pas les supprimées).
  `getMyCourses` / requêtes classe renvoient `newQuestionCount`.
- **Ampleur** : migration + comptages dans 2-3 requêtes + un filtre. L'UI
  fine (feed) est repoussée — « sobre et efficace » suffira.

### ✅ Barre de navigation basse (mobile) — fait (Phase 28, ADR 0028)

Barre fixe en bas, `md:hidden` : Accueil · Cours (feuille de saut) · **+**
(feuille : cours + chapitre + question/résumé/quiz) · Notifs · Profil.
En-tête allégé sur mobile (cloche + « Nom ⚙ » descendent dans la barre).

Reste : le **passage responsive mobile complet** — la Phase 28 a fait la
barre + l'allègement d'en-tête ; pass de finition : en-tête de cours (nav
empilée sous le titre), marges latérales (`px-4 sm:px-6`), recherche des
questions (pleine largeur), **grille des cours à 2 colonnes en mobile avec
vignette compacte** (padding réduit, badges « nouv. » abrégés, ligne
« N questions · N résumés · N membres » masquée < sm). À revoir encore :
`QuizRunner`, listes de membres, éventuels tableaux.

### ✅ Distinguer l'intention d'une question — fait (Phase 26, ADR 0026)

`questions.purpose` (`help` / `challenge`, migration `0022`) : « J'ai besoin
d'aide » vs « Question défi ». Sélecteur au formulaire (éditable), pastille
`PurposeBadge` (violette pour « défi ») sur listes / détail / zone
« nouvelles », filtre `?purpose=` sur la page Questions.

Reste : **lien quiz ↔ « défi »** (prioriser / restreindre le générateur aux
questions défi). Choix utilisateur : rien pour l'instant, à faire dans une
phase dédiée au quiz.

### Quiz au niveau de la classe

- **Idée** : un bouton « Faire un quiz » sur la page de la classe (à côté de
  « Créer un cours »). Au lancement, choix de la **portée** : toute la classe
  / un cours / des chapitres précis. Utile quand les cours sont liés (ex.
  formation conducteur) ; une classe « classique » n'utilise juste pas
  l'option « toute la classe ».
- **Ampleur** : vraie phase. `quizzes` / `quiz_attempts` sont liés à un
  `course_id` → permettre une portée « classe » (course_id nullable +
  class_id, ou un champ `scope`). `selectQuizQuestions` devient class-aware
  (piocher dans les questions de tous les cours de la classe, filtrable par
  cours / chapitre). Pages runner + résultat à adapter.
- En attendant : le quiz reste **par cours**, accessible depuis chaque cours.

### Supprimer un cours / une classe — hésitant, reporté

- Aujourd'hui on ne peut que *quitter*. Suppression = ligne à effacer dans
  Supabase (cascade FK OK).
- **Réserve** : un admin qui supprimerait tout du jour au lendemain, ça fait
  peur. À réserver au **créateur** + garde-fous forts (re-saisie du nom,
  peut-être délai / corbeille). Pas prioritaire.

### Sous-chapitres / regroupement des chapitres — écarté

La scission **classe → cours → chapitre** couvre le besoin. Aller plus
profond (sous-chapitres) n'est pas jugé nécessaire.

### Rattacher un cours existant à une classe — écarté

Pas de besoin réel identifié.

### ✅ Types de question (ouverte / vrai-faux / QCM) — fait (Phase 11, ADR 0013)

Quiz auto-corrigés + page de QCM interactive (clic → rouge/vert). Discussion
en bulles au passage.

### ✅ Répondre avant de voir + fusion des doublons — fait (Phase 12, ADR 0014)

Réponses ouvertes masquées tant qu'on n'a pas participé ; doublons **exacts**
fusionnés en vote ; vote **anonyme** (pastille « 👍 N »).

### ✅ Photo attachée à une question — fait (Phase 14, ADR 0016)

Une image par question, bucket Storage privé, URL signées, redimensionnement
navigateur. Reste : nettoyage des images orphelines (cf. reports).

## Reports connus (dette assumée)

| Sujet                                           | Référence               | Note                                                                                               |
| ----------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Responsive mobile à peaufiner                   | brief §17, Phase 10     | Cible n°1 ; à faire avant adoption large par la classe                                             |
| Notifications : pas de temps réel (WebSocket)           | Phase 21, ADR 0021      | Compteur rafraîchi à la navigation. Push navigateur : **fait** (Phase 23, ADR 0023) ; l'in-app n'est pas « live » pour autant |
| Push : envoi depuis les Server Actions (best-effort)    | Phase 23, ADR 0023      | Pas depuis les triggers → un futur chemin d'écriture pourrait oublier le push. L'in-app reste garanti. Alternative Edge Function écartée (trop d'infra) |
| Icône PWA provisoire                                    | Phase 23                | Monogramme « R » généré (`scripts/gen-icons.mjs`). À remplacer par un vrai visuel avec l'identité graphique |
| Recherche plein-texte                           | ADR 0002, 0008          | Aujourd'hui : `ILIKE` sur le titre uniquement                                                      |
| Types Supabase générés                          | `src/types/database.ts` | Remplacer les types écrits à la main par `supabase gen types`                                      |
| États de chargement / erreurs soignés           | Phase 10                | `loading.tsx`, messages d'erreur, empty states                                                     |
| Tests d'intégration (permissions inter-classes) | brief §27               | Aujourd'hui : tests unitaires des schémas seulement                                                |
| Nom du produit / domaine                        | —                       | « Revibase » est provisoire                                                                        |
| Images de question orphelines                   | ADR 0016                | Upload avant « Publier » réussi puis onglet fermé → fichier sans question. Nettoyage périodique à prévoir |
