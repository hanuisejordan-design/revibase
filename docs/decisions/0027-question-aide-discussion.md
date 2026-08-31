# 0027 — Question « besoin d'aide » : discussion d'abord, « aide validée »

- Statut : accepté
- Date : 2026-08-31
- Précise : [0026](0026-intention-question.md) (intention) et
  [0021](0021-notifications.md) (notifications)

## Contexte

Une question `purpose = help` appelle surtout un **échange** (« je bloque,
explique-moi »), pas une réponse-fiche votée comme une question `challenge`.
Sur la page détail, les réponses passaient toujours en premier.

## Décision

Uniquement quand `purpose = 'help'` (et question ouverte) :

- **Discussion en premier** sur la page détail, puis la section Réponses
  (formulaire + liste + validation). Pour `challenge` (et les QCM), l'ordre
  inchangé : Réponses puis Discussion.
- **Valider une réponse reste possible** (même mécanique : formateur, trigger
  `enforce_answer_validation`). Seul le **libellé de la notification**
  change :
  - in-app (`/notifications`) : « **a validé ton aide sur** « … » » au lieu
    de « a validé ta réponse à « … » ». Choisi par ligne selon
    `questions.purpose`, ajouté à `listNotifications` (pas de nouveau type,
    pas de changement de trigger).
  - push (`toggleValidateAction`) : même bascule de texte.

## Alternatives écartées

- **Nouveau type de notification `help_validation`** : imposerait de toucher
  la contrainte `check` de `notifications.type` et le trigger
  `notify_on_validation`. Le libellé calculé à la lecture suffit.
- **Masquer / renommer toute la section Réponses pour `help`** : trop
  invasif ; l'utilisateur veut garder « valider une réponse à la fin ».
- **Ordre configurable par question** : l'intention (`purpose`) porte déjà
  l'information, pas besoin d'un réglage de plus.

## Conséquences

- La bascule d'ordre est purement présentation (`discussionFirst = isOpen &&
  purpose === 'help'` dans la page détail).
- `NotificationItem` gagne `questionPurpose` ; `listNotifications` embarque
  `questions(... purpose)`.
- Reclasser une question `challenge` → `help` (ou l'inverse) réordonne la
  page au prochain rendu.
