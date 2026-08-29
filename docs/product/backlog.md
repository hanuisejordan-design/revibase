# Backlog

Idées et reports notés au fil de l'usage. Rien ici n'est engagé — on
priorise selon les retours de la classe.

## Prochaines fonctionnalités (demandées)

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

### Répondre avant de voir + fusion des doublons (#1 + #2) — EN COURS

Retours d'usage. Les deux se conçoivent ensemble (cf. discussion) :

- **Question ouverte** : tant que tu n'as pas répondu, les réponses des autres
  sont **masquées** (bouton « Voir les N réponses sans répondre » pour
  déroger — cas révision).
- **À la validation de ta réponse**, égalité **stricte** (espaces / casse /
  ponctuation de fin ; **pas** les fautes) avec une réponse existante :
  - correspond → pas de doublon, ton **vote** est ajouté à celle-ci
    (« ta réponse rejoignait celle de X ») ;
  - ne correspond pas → nouvelle réponse **+ ton vote automatique**.
- Le compteur veut alors dire « **X personnes ont donné cette réponse** »
  (auteur inclus) ; afficher les **noms** des votants.
- Pas de détection des quasi-doublons / fautes (peu fiable) — le vote manuel
  reste l'outil pour ça.
- **Ampleur** : moyen, pas de migration.

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

### Photo attachée à une question

- **Pourquoi** : le domaine est très visuel (signaux, matériel). Poser une
  question à partir d'une image.
- **À faire** : activer **Supabase Storage** (bucket + règles d'accès par
  classe), champ image sur `questions` (ou table `question_attachments` pour
  plusieurs), upload depuis le formulaire, affichage sur la carte + la page.
- **Ampleur** : moyen, indépendant du reste.

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
