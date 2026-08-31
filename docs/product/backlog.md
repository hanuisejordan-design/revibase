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

### ✅ Nouveautés depuis la dernière visite — fait (Phase 22, ADR 0022)

Marqueur de lecture `course_reads` (migrations `0018` + `0019`, privé) : deux
curseurs par (cours, utilisateur) — `questions_seen_at`, `summaries_seen_at`.
Deux couleurs : **ambre** pour les questions, **vert** pour les résumés.
Pastilles « N nouvelles questions » / « N nouveaux résumés » sur les vignettes
de cours et de classe ; deux encarts sur la page de la classe → zones
`class/[classId]/nouvelles` et `class/[classId]/nouveaux-resumes` qui listent
tout ce qui est nouveau, le plus ancien d'abord, pour l'enchaîner. Curseur
(par type) remis à jour à l'ouverture de la liste correspondante. L'ancien
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
| Notifications : pas de temps réel / push               | Phase 21, ADR 0021      | Centre de notifs livré (réponse / commentaire / validation). Compteur rafraîchi à la navigation ; pas de WebSocket ni de push navigateur |
| Recherche plein-texte                           | ADR 0002, 0008          | Aujourd'hui : `ILIKE` sur le titre uniquement                                                      |
| Types Supabase générés                          | `src/types/database.ts` | Remplacer les types écrits à la main par `supabase gen types`                                      |
| États de chargement / erreurs soignés           | Phase 10                | `loading.tsx`, messages d'erreur, empty states                                                     |
| Tests d'intégration (permissions inter-classes) | brief §27               | Aujourd'hui : tests unitaires des schémas seulement                                                |
| Nom du produit / domaine                        | —                       | « Revibase » est provisoire                                                                        |
| Images de question orphelines                   | ADR 0016                | Upload avant « Publier » réussi puis onglet fermé → fichier sans question. Nettoyage périodique à prévoir |
