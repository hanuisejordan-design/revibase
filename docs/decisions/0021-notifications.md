# 0021 — Centre de notifications

- Statut : accepté
- Date : 2026-08-30
- Voir aussi : [0009](0009-reponses-votes.md), [0010](0010-discussions.md),
  [0011](0011-validation-formateur.md)

## Contexte

La table `notifications` existe depuis [0002](0002-modele-donnees.md) mais
rien ne l'alimentait et aucune UI ne l'affichait. Les membres ne savent pas
quand on répond / commente leur question, ni quand leur réponse est validée.

## Décision

**v1 — événements « quelqu'un a agi sur ton contenu »** :

| Événement | Notifié |
| --- | --- |
| réponse ajoutée à une question | l'auteur de la question |
| commentaire ajouté à une question | l'auteur de la question |
| réponse validée par un formateur | l'auteur de la réponse |
| nouvelle question posée dans un cours | tous les autres membres du cours |

- **Écriture par triggers `security definer`** sur `answers` (insert +
  update) et `comments` (insert) — migration `0016` ; sur `questions`
  (insert) — migration `0017`. Robuste — impossible à oublier, indépendant du
  chemin d'appel — et contourne l'absence voulue de policy INSERT sur
  `notifications`. On ne se notifie jamais soi-même (`actor <> destinataire`).
- **`new_question`** (`0017`) notifie l'union « membres directs du cours
  (`course_members`) + membres via la classe parente (`class_members` sur
  `courses.class_id`) », dédoublonnée, l'auteur exclu. Une notification n'est
  pas de l'UI : elle fait partie du pratique de l'app, d'où son inclusion dès
  la v1 (contrairement à un *feed* « nouvelles questions », repoussé).
- **Lecture** : `listNotifications()` (50 dernières, avec le nom de l'acteur,
  le titre et le cours de la question) ; `countUnreadNotifications()` pour la
  cloche de l'en-tête (`read_at is null`).
- **UI** : cloche 🔔 + compteur non-lus dans l'en-tête `(app)` → page
  `/notifications` (liste, ligne teintée si non lue, lien vers la question,
  « Tout marquer comme lu »). **Ouvrir la page marque tout lu**
  (`MarkAllRead`, effet client) ; le rendu initial garde la teinte, la base
  est vidée pour la navigation suivante.
- Pas de realtime, pas de push. Le compteur se rafraîchit à chaque navigation
  (l'en-tête est un Server Component).

## Alternatives écartées

- **Écriture depuis les Server Actions** (`createAnswerAction`…) : fragile
  (un nouveau chemin d'écriture oublie la notif) et demande une policy INSERT
  ou un RPC. Les triggers sont la source de vérité.
- **Feed « nouvelles questions depuis ma dernière visite »** (section en haut
  du cours, mode « enchaîner ») : c'est de l'UI, repoussé (`course_reads`,
  backlog). La **notification** `new_question`, elle, est retenue : une ligne
  par membre et par question, volume acceptable à l'échelle d'un cours.
- **Notifier les autres répondeurs / commentateurs d'un fil** : reporté ;
  v1 se limite à l'auteur de la question / de la réponse.
- **Marquage lu par notification individuelle au clic** : friction en plus
  pour peu de gain ; « ouvrir la page = tout lu » suffit.

## Conséquences

- Le trigger `notify_on_validation` est un `AFTER UPDATE` sur `answers`
  (distinct des triggers `BEFORE` existants) ; il ne notifie que quand
  `validated_by` passe à une valeur non nulle.
- `notify_on_new_question` insère N lignes d'un coup (une par membre). Dans un
  gros cours actif ça peut devenir bruyant → à regrouper / rendre optionnel
  (préférences par cours) si besoin.
- Un flot de réponses = un flot de notifications (pas de regroupement). À
  revoir si ça devient bruyant.
- `services/notifications/` (vide depuis 0001) reste inutilisé — la logique
  est en base (triggers) + `features/notifications/`.
