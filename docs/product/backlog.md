# Backlog

Idées et reports notés au fil de l'usage. Rien ici n'est engagé — on
priorise selon les retours de la classe.

## Prochaines fonctionnalités (demandées)

### Types de question : QCM / vrai-faux / ouverte

- **Pourquoi** : débloque les **quiz auto-corrigés** (score objectif, pas
  seulement « su / pas su »). Complète l'auto-évaluation (ADR 0003).
- **Déjà en place** : `questions.kind` (`open` | `mcq`) et la table
  `question_options` existent depuis la migration 0001 (ADR 0002 §4).
- **À faire** :
  - sélecteur de type sur le formulaire « Poser une question »
    (`open` par défaut ; `true_false` = QCM à 2 options pré-remplies) ;
  - éditeur d'options pour les QCM (ajouter des choix, cocher le(s) bon(s)) ;
    migration pour ouvrir la RLS `question_options` à tout membre (comme les
    chapitres, ADR 0007) ;
  - page question qui s'affiche selon le type (un QCM n'a pas de « réponses
    communautaires » — la bonne réponse vient des options ; la discussion
    reste) ;
  - quiz : QCM = choix cliquable + correction auto (`quiz_answers.
selected_answer_id` / `is_correct`, déjà au schéma) ; ouverte =
    auto-évaluation ; quiz mélangé = score combiné.
- **Ampleur** : une phase dédiée + petite migration.

### Photo attachée à une question

- **Pourquoi** : le domaine est très visuel (signaux, matériel). Poser une
  question à partir d'une image.
- **À faire** : activer **Supabase Storage** (bucket + règles d'accès par
  classe), champ image sur `questions` (ou table `question_attachments` pour
  plusieurs), upload depuis le formulaire, affichage sur la carte + la page.
- **Ampleur** : moyen, indépendant du reste.

## Reports connus (dette assumée)

| Sujet                                              | Référence               | Note                                                                                               |
| -------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Responsive mobile à peaufiner                      | brief §17, Phase 10     | Cible n°1 ; à faire avant adoption large par la classe                                             |
| Notifications                                      | Phase 9                 | Socle en place (`notifications`, `services/notifications/`) ; UI à construire si le besoin ressort |
| Gestion des rôles (promouvoir un membre formateur) | ADR 0011                | Aujourd'hui : créateur = seul formateur                                                            |
| Recherche plein-texte                              | ADR 0002, 0008          | Aujourd'hui : `ILIKE` sur le titre uniquement                                                      |
| Édition d'une question                             | ADR 0008                | Aujourd'hui : création + suppression douce ; pas de modification                                   |
| Types Supabase générés                             | `src/types/database.ts` | Remplacer les types écrits à la main par `supabase gen types`                                      |
| États de chargement / erreurs soignés              | Phase 10                | `loading.tsx`, messages d'erreur, empty states                                                     |
| Tests d'intégration (permissions inter-classes)    | brief §27               | Aujourd'hui : tests unitaires des schémas seulement                                                |
| Nom du produit / domaine                           | —                       | « Revibase » est provisoire                                                                        |
