# 0015 — Groupes : une couche au-dessus des classes

- Statut : accepté
- Date : 2026-08-29
- Voir aussi : [0005](0005-classes.md), [0002](0002-modele-donnees.md)

## Contexte

Le modèle est plat : `classe → chapitres → questions`. Il marche pour une
promo mono-domaine (la classe *est* le sujet), mais pas pour un cours
« classique » à plusieurs matières : « Math », « Français », « Géo » sont trop
larges pour être des chapitres, et un chapitre « Trigonométrie » créé à plat
se retrouve au même niveau que « Math ».

Deux façons d'ajouter le niveau manquant :

- **l'insérer au milieu** (`classe → cours → chapitres`) : chaque route gagne
  un segment, **toutes** les requêtes et règles RLS gagnent un saut, le
  générateur de quiz et le seed sont touchés — on redécoupe le cœur de l'app
  déjà en ligne ;
- **l'ajouter au-dessus** : un `groupe` contient des classes ; tout ce qui
  existe sous la classe est inchangé.

## Décision

**Une couche `groupe` au-dessus de la classe.** La classe reste l'unité de
tout le reste (chapitres, questions, réponses, quiz, RLS, routes).

- Tables `groups` (id, name, `join_code` unique, created_by) et
  `group_members` (group_id, user_id, `is_admin`). `classes.group_id`
  nullable.
- **Accès** : être membre d'un groupe = accès à **toutes** ses classes, sans
  ligne `class_members`. On étend l'aide RLS `is_class_member(class_id)` :
  « ligne `class_members` **OU** membre du groupe propriétaire ». Ajout
  purement additif — une classe sans groupe (`group_id is null`) ne change
  pas.
- **Rôle** : un membre par le groupe est `student` par défaut ; « formateur »
  reste une ligne `class_members` explicite. `is_class_trainer` n'est pas
  touché.
- **Admin de groupe ≠ formateur de classe** : indépendants. L'admin gère le
  groupe (nom, code, classes, membres) ; le formateur valide les réponses.
- RPC `create_group`, `join_group_by_code` (calqués sur les classes) ;
  `create_class` gagne un `p_group_id` optionnel (si fourni, l'appelant doit
  être admin du groupe).
- `getClassContext` s'appuie désormais sur la RLS de `classes` (et non sur la
  présence d'une ligne `class_members`) pour décider de la visibilité ; il
  expose `groupId`, `groupName`, `isExplicitMember`.
- **Opt-in** : pas de groupe = l'app d'avant. Le tableau de bord affiche les
  classes groupées sous leur groupe, puis « Autres classes ».
- **v1** : on crée une classe **dans** un groupe. Rattacher une classe
  existante, sous-groupes, quiz « tout le groupe » : plus tard.

## Alternatives écartées

- **`classe → cours → chapitres` (niveau au milieu)** : le bon modèle
  « théorique », mais coût et risque disproportionnés sur une base déjà en
  service ; le résultat pour l'utilisateur est le même (promo → cours →
  chapitres) avec la couche au-dessus.
- **`class_members` obligatoire pour chaque classe du groupe** (auto-inséré à
  l'adhésion) : lourd (N classes × M membres), et une classe ajoutée après
  coup n'inscrirait personne. L'appartenance dérivée via `group_members` est
  plus simple et toujours à jour.
- **Rôle « formateur » hérité du statut d'admin de groupe** : mélange gestion
  et pédagogie ; gardés séparés.

## Conséquences

- `is_class_member` fait une jointure de plus (`classes → group_members`) ;
  négligeable, et `security definer` évite la récursion RLS.
- La liste « Participants » d'une classe de groupe ne montre que les membres
  **explicites** (souvent juste le créateur) ; les vrais participants sont
  ceux du groupe, listés sur la page du groupe.
- Rejoindre par le **code d'une classe** qui appartient à un groupe crée une
  ligne `class_members` (accès à cette seule classe) — indépendant du groupe,
  c'est voulu.
- Le point « créateur d'une classe = formateur d'office » reste ouvert
  (backlog *rôles admin ≠ formateur*), maintenant avec un précédent :
  `group_members.is_admin`.
