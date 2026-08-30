# 0019 — Rôles d'un cours : admin ≠ formateur

- Statut : accepté
- Date : 2026-08-30
- Voir aussi : [0011](0011-validation-formateur.md), [0015](0015-groupes.md),
  [0017](0017-renommage-groupe-classe-cours.md)

## Contexte

Créer un cours faisait de l'auteur un `trainer` (formateur) d'office — or
c'est souvent juste l'élève qui a monté le cours, pas un enseignant. Et
c'est le rôle `trainer` qui autorise la validation d'une réponse
([0011](0011-validation-formateur.md)).

## Décision

Deux attributs **indépendants** sur `course_members` :

| Attribut | Qui | Peut |
| --- | --- | --- |
| `is_admin` (booléen) | le créateur du cours ; peut en nommer d'autres | code d'invitation, gérer les membres, **attribuer le rôle formateur** |
| `role` (`student` / `trainer`) | `trainer` **attribué par un admin** | **valider une réponse** (inchangé, [0011](0011-validation-formateur.md)) |

- Arriver dans un cours (par code ou via la classe) = `is_admin = false,
  role = 'student'` (**élève**).
- `create_course` (RPC) : le créateur devient `is_admin = true,
  role = 'student'`.
- Migration `0014` : colonne `course_members.is_admin` ; **backfill** des
  `trainer` actuels (les créateurs) en `is_admin = true`, `role` inchangé —
  ils validaient déjà, on ne casse rien.
- `is_course_admin()` + policy `UPDATE` sur `course_members` réservée aux
  admins du cours. L'action serveur **refuse de retirer le dernier admin**.
- UI : liste des membres dans les paramètres du cours ; un admin y bascule
  « Admin » / « Formateur » par membre. Badges pour les non-admins.
- **Niveau classe inchangé** : `class_members.is_admin` existe déjà ; il n'y
  a pas de « formateur » au niveau classe (c'est par cours).

## Alternatives écartées

- **Garder « créateur = formateur »** : c'est le problème d'origine.
- **Un seul champ `role` à trois valeurs** (`student` / `admin` /
  `trainer`) : empêche d'être admin **et** formateur à la fois (cas courant
  du prof qui monte son cours). D'où deux attributs orthogonaux.
- **Rôles au niveau classe** : la pédagogie (validation) se joue dans un
  cours, pas dans la promo — garder le formateur par cours.

## Conséquences

- Les cours **existants** : leur créateur reste formateur (backfill). Le
  nouveau comportement ne vaut que pour les cours créés après la migration.
- Un admin qui n'est pas formateur ne peut pas valider de réponse tant qu'il
  ne s'attribue pas (ou qu'un autre admin ne lui attribue pas) le rôle.
- `RoleBadge` (2 états) supprimé — badges rendus directement là où c'est
  utile (carte de cours, gestion des membres).
