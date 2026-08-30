# 0017 — Renommage : groupe → classe, classe → cours

- Statut : accepté
- Date : 2026-08-30
- Voir aussi : [0005](0005-classes.md), [0015](0015-groupes.md)

## Contexte

La couche « groupe » ajoutée en [0015](0015-groupes.md) donne trois niveaux :
`groupe → classe → chapitre`. À l'usage, le vocabulaire ne colle pas au
langage courant : pour une promo, le mot juste pour l'ensemble des gens est
**« classe »**, et « Maths », « Français »… sont des **« cours »**.

## Décision

**Renommage complet, structure inchangée** (les 3 niveaux restent) :

| Avant | Après |
| --- | --- |
| `groups` / « groupe » | `classes` / « classe » (la promo, code d'invitation, membres, admin) |
| `classes` / « classe » | `courses` / « cours » (Maths, Français… ; questions, quiz) |
| `chapters` | inchangé |
| `group_members` | `class_members` |
| `class_members` | `course_members` |
| `<table>.class_id` (chapters, questions, quizzes) | `course_id` |
| `classes.group_id` | `courses.class_id` |
| fonctions `is_class_*`, `question_class`, … | `is_course_*`, `question_course`, … ; `is_group_*` → `is_class_*` |
| RPC `create_class` / `join_class_by_code` | `create_course` / `join_course_by_code` ; `create_group` → `create_class` |

- **Portée : tout** — base (migration `0011`), code (`features/groups` →
  `features/classes`, `features/classes` → `features/courses`, routes
  `/group/*` → `/class/*`, `/class/*` → `/course/*`), libellés FR.
- **Migration `0011` en `RENAME`** : opérations de métadonnée, **aucune
  donnée réécrite**. Les policies RLS et le trigger de validation suivent les
  renommages tout seuls (références par OID / n° de colonne) ; seuls les
  **corps de fonctions** sont réécrits (texte re-parsé à l'exécution).
  Idempotente (chaque renommage gardé par « ancien existe ET nouveau absent »).
- **Tableau de bord refait** : l'action mise en avant est **rejoindre / créer
  une classe** ; les **cours** se créent dans une classe. Un **cours
  autonome** (sans classe) reste possible, en action secondaire, pour un
  simple groupe de révision.

## Alternatives écartées

- **Libellés + routes seulement, tables inchangées** : plus rapide et sans
  risque, mais laisse un décalage permanent code ↔ UI (`table groups` = « la
  classe »). Choix explicite de tout aligner pour un projet d'apprentissage.
- **Insérer un vrai niveau au milieu** (`classe → cours → chapitre` en
  nouvelles tables) : déjà écarté en [0015](0015-groupes.md) ; ici on ne fait
  que renommer.

## Conséquences

- Gros diff mécanique (~60 fichiers), livré en 3 commits (`classes→courses`,
  `groups→classes` + tableau de bord, migration + docs) ; `build` / `lint` /
  tests verts à chaque étape.
- Les noms internes d'index / contraintes gardent l'ancien libellé
  (`class_members_user_idx`…) — cosmétique, sans effet.
- Les ADR 0005 / 0015 gardent leur vocabulaire d'origine (on ne réécrit pas
  une décision) ; cet ADR fait foi pour le mapping.
