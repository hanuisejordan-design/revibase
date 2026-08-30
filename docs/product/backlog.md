# Backlog

Idées et reports notés au fil de l'usage. Rien ici n'est engagé — on
priorise selon les retours de la classe.

## Prochaines fonctionnalités (demandées)

### ✅ Renommage groupe → classe → cours + refonte tableau de bord — fait (Phase 15, ADR 0017)

Vocabulaire aligné (base incluse, migration `0011` en `RENAME`). Tableau de
bord : action principale = rejoindre / créer une **classe** ; les **cours** se
créent dedans ; cours autonome possible en secondaire.

### Rattacher un cours existant à une classe

- **Manque** : à la création d'un cours on peut le mettre dans une classe
  (`create_course(p_class_id)`), mais un cours **déjà créé** hors classe ne
  peut plus y être rattaché depuis l'UI. Il reste bloqué dans « Autres cours ».
- **À faire** : sur `course/[courseId]/settings`, pour un admin d'au moins
  une classe, un sélecteur « Rattacher ce cours à une classe » (liste des
  classes qu'il administre) → RPC `attach_course_to_class(p_course, p_class)`
  `security definer` (vérifie `is_class_admin` + que l'appelant peut gérer le
  cours). Détacher = remettre `class_id` à `null`.
- **Ampleur** : petite (1 RPC + 1 select dans les paramètres).

### ✅ Résumés par cours — fait (Phase 16, ADR 0018)

Onglet « Résumés » : un fichier + un titre + chapitre optionnel, bucket privé,
suppression auteur/formateur. **v2** : texte markdown rédigé dans l'app
(`summaries.body`), plusieurs fichiers, « 👍 utile ».

### Supprimer un cours / une classe

- **Manque** : on peut seulement *quitter*. Aucun moyen de supprimer un cours
  ou une classe qu'on a créé (reste dans « Autres cours » / le tableau de
  bord indéfiniment). Aujourd'hui = suppression de ligne dans Supabase
  (`delete from public.courses where …`, cascade OK).
- **À faire** : action `deleteCourseAction` / `deleteClassAction` réservée au
  créateur (ou admin de la classe) + bouton dans les paramètres, avec
  confirmation forte (double saisie du nom ?). Cascade déjà en place côté FK.
- **Ampleur** : petite.

### Rôles : séparer « admin de la classe » et « formateur »

- **Problème** : aujourd'hui, créer une classe = devenir `formateur`
  d'office. Or le créateur est souvent juste l'organisateur du groupe (un
  élève), pas un enseignant.
- **Modèle proposé** :
  - `class_members.is_admin` (booléen) — **gestion** de la classe : renommer,
    code d'invitation, membres, attribution des rôles. Le créateur l'a par
    défaut ; un admin peut nommer d'autres admins.
  - `class_members.role` redevient purement **pédagogique** : `student` par
    défaut ; `trainer` (= « formateur ») est **attribué à quelqu'un par un
    admin** (typiquement un vrai formateur qui rejoint la classe).
  - Validation officielle d'une réponse = rôle `trainer` (acte pédagogique).
    Une classe sans formateur n'a simplement pas de réponses « validées » —
    c'est l'état communautaire honnête.
- **À faire** : migration (colonne `is_admin` ; `create_class` pose
  `is_admin = true, role = 'student'` ; policies `*_trainer` à revoir selon
  admin vs trainer ; policy `UPDATE` sur `class_members` pour l'attribution) ;
  UI dans Paramètres (liste des membres avec cases « admin » / « formateur ») ;
  `RoleBadge` à 3 états ; `getClassContext` renvoie `isAdmin` + `role`.
- **Ampleur** : petite/moyenne. **À traiter tôt** : l'app est en ligne ;
  moins il y a de classes créées, moins il y a à migrer.
- Remplace le report « gestion des rôles » d'ADR 0011.

### ✅ Types de question (ouverte / vrai-faux / QCM) — fait (Phase 11, ADR 0013)

Quiz auto-corrigés + page de QCM interactive (clic → rouge/vert). Discussion
en bulles au passage.

### ✅ Répondre avant de voir + fusion des doublons — fait (Phase 12, ADR 0014)

Réponses ouvertes masquées tant qu'on n'a pas participé ; doublons **exacts**
fusionnés en vote ; vote **anonyme** (pastille « 👍 N »).

### ✅ Photo attachée à une question — fait (Phase 14, ADR 0016)

Une image par question, bucket Storage privé, URL signées, redimensionnement
navigateur. Reste : nettoyage des images orphelines (cf. reports).

### Regrouper les chapitres (sous-chapitres / modules)

- **Le cas multi-matières est traité** par les **groupes** (Phase 13,
  ADR 0015) : « Math », « Français »… = des classes d'un même groupe. Reste
  ici : la structure à 2 niveaux **à l'intérieur d'une seule classe** (ex.
  module « HLT » avec des sections « HLT 2A1 » … « HLT 2A12 »).
- **Pourquoi** : une liste plate de 15+ chapitres devient confuse et on ne
  peut pas « réviser tout HLT d'un coup ».
- **Pas urgent** : d'abord voir si la liste plate gêne vraiment en usage
  réel (convention de nommage `HLT 2A1`, `HLT 2A2`… en attendant).
- **Options, du moins cher au plus cher** :
  1. rien — juste nommer les chapitres `HLT 2Ax` ;
  2. **étiquette `module`** (colonne texte nullable sur `chapters`) :
     affichage groupé par module (`<optgroup>` / titres de section), quiz
     « tout le module » ; pas de vraie arborescence — **bon rapport
     bénéfice/coût** ;
  3. **vrais sous-chapitres** (`chapters.parent_id` auto-référentiel) : arbre
     à 2 niveaux, filtre imbriqué, sélecteur 2 niveaux, générateur de quiz
     par module / sous-chapitre. Seulement si plusieurs gros modules ont
     chacun beaucoup de sous-parties.
- **Ampleur** : (2) petite + migration ; (3) moyenne + migration + form
  question + filtre questions + générateur de quiz + seed.

## Reports connus (dette assumée)

| Sujet                                           | Référence               | Note                                                                                               |
| ----------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Responsive mobile à peaufiner                   | brief §17, Phase 10     | Cible n°1 ; à faire avant adoption large par la classe                                             |
| Notifications                                   | Phase 9                 | Socle en place (`notifications`, `services/notifications/`) ; UI à construire si le besoin ressort |
| Gestion des rôles (admin ≠ formateur)           | voir plus haut          | Créateur = admin ; formateur = rôle attribué. Aujourd'hui : créateur = formateur d'office          |
| Recherche plein-texte                           | ADR 0002, 0008          | Aujourd'hui : `ILIKE` sur le titre uniquement                                                      |
| Édition d'une question                          | ADR 0008                | Aujourd'hui : création + suppression douce ; pas de modification                                   |
| Types Supabase générés                          | `src/types/database.ts` | Remplacer les types écrits à la main par `supabase gen types`                                      |
| États de chargement / erreurs soignés           | Phase 10                | `loading.tsx`, messages d'erreur, empty states                                                     |
| Tests d'intégration (permissions inter-classes) | brief §27               | Aujourd'hui : tests unitaires des schémas seulement                                                |
| Nom du produit / domaine                        | —                       | « Revibase » est provisoire                                                                        |
| Images de question orphelines                   | ADR 0016                | Upload avant « Publier » réussi puis onglet fermé → fichier sans question. Nettoyage périodique à prévoir |
