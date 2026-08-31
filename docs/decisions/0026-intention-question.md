# 0026 — Intention d'une question : « besoin d'aide » vs « défi »

- Statut : accepté
- Date : 2026-08-31
- Voir aussi : [0008](0008-questions.md), [0013](0013-types-de-question.md)

## Contexte

Deux usages se mélangeaient dans la même liste : « je bloque, aidez-moi » et
« je connais la réponse, c'est pour vous entraîner / alimenter les quiz ».
Impossible de filtrer, ni de repérer d'un coup d'œil.

## Décision

- **Colonne `questions.purpose`** (migration `0022`) : `help` (défaut) |
  `challenge`, contrainte `check`. Additive : les questions existantes
  passent en `help`.
- **Modifiable après coup** (contrairement à `kind`, figé) — dans
  `updateQuestionAction` et le formulaire.
- Libellés : **« J'ai besoin d'aide »** / **« Question défi »** (courts :
  « Besoin d'aide » / « Défi »). Constantes dans `constants/app.ts`
  (`QUESTION_PURPOSES`, `QUESTION_PURPOSE_LABELS`, `QUESTION_PURPOSE_SHORT`).
- **Formulaire** : sélecteur « Pourquoi cette question ? » (create + edit),
  avec une phrase d'aide sur « Défi ».
- **Affichage** : `PurposeBadge` (`help` = pastille discrète bordée ;
  `challenge` = pastille violette) sur les cartes de liste, la page détail,
  la zone « nouvelles questions » de la classe.
- **Filtre** : chips « Toutes intentions / Besoin d'aide / Défi » sur
  `/course/[id]/questions` (`?purpose=help|challenge`), `parsePurpose` +
  `ListQuestionsOptions.purpose` → `.eq("purpose", …)`.
- **Quiz : inchangé.** Le générateur ne tient pas compte de `purpose` pour
  l'instant (choix explicite). Le lien quiz ↔ « défi » sera une phase
  ultérieure (cf. backlog).

## Alternatives écartées

- **Réutiliser `kind`** : `kind` décrit le **format de réponse** (ouverte /
  V-F / QCM), orthogonal à l'intention.
- **Ne marquer que les « défi »** (pas de pastille sur `help`) : on veut la
  distinction explicite des deux côtés.
- **Prioriser les « défi » dans le quiz dès maintenant** : reporté pour
  livrer la brique (marquage + filtre) sans toucher au générateur.

## Conséquences

- `purpose` est dans `QUESTION_SELECT` → **la migration `0022` doit être
  appliquée avant le déploiement du code** (sinon la sélection échoue et les
  listes de questions apparaissent vides). Migration additive : sûre à passer
  en avance.
- Un `purpose` par question, éditable : l'auteur ou un formateur peut
  reclasser une question.
