# 0028 — Barre de navigation basse (mobile)

- Statut : accepté
- Date : 2026-08-31

## Contexte

Sur mobile, la navigation reposait sur l'en-tête (retour au tableau de bord
via le nom de l'app, cloche, « Nom ⚙ ») et des liens « ← » de retour jugés
trop petits. Passer d'un cours à l'autre imposait de repasser par le tableau
de bord.

## Décision

Une **barre fixe en bas**, accès au pouce, **mobile uniquement**
(`md:hidden`) ; en desktop l'en-tête reste seul.

- **5 onglets** : Accueil (`/dashboard`) · Cours · **+** (centre, mis en
  avant) · Notifs (`/notifications`, badge non-lus) · Profil
  (`/parametres`).
- **En-tête allégé sur mobile** : cloche + « Nom ⚙ » deviennent
  `hidden md:flex` ; il ne reste que le nom de l'app (les fils d'Ariane des
  pages restent).
- **« Cours »** ouvre une feuille (bottom sheet) listant **tous les cours
  accessibles** (adhésion directe + via la classe), groupés par classe →
  saut direct vers `/course/[id]`. Query légère `getMyCourseOptions()`
  (id + nom + nom de classe seulement, `cache()`), appelée dans le layout
  `(app)`.
- **« + »** ouvre une feuille en **2 temps** : d'abord **quoi** (question /
  résumé / quiz), puis **dans quel cours** (pré-rempli avec le cours courant
  si on y est) et, pour une question, **quel chapitre** (chargé via
  `listCourseChaptersAction`). Bouton final → `questions/new?chapter=…`,
  `summaries/new` ou `quiz`. La feuille est `key`-remontée à chaque
  ouverture pour repartir du contexte courant.
- `<main>` reçoit `pb-24 md:pb-8` ; la barre respecte
  `env(safe-area-inset-bottom)`.

## Alternatives écartées

- **Barre visible aussi en desktop** : redondant avec l'en-tête.
- **Garder cloche + profil dans l'en-tête mobile** : doublon avec la barre.
- **Feuille « + » qui navigue direct sans choisir le cours** : ne marche que
  dans un cours ; on veut créer depuis n'importe où.
- **Sélection du chapitre repoussée au formulaire** : le formulaire le
  propose déjà, mais l'utilisateur veut préciser cours **et** chapitre dès
  le « + ».

## Conséquences

- La plainte « bouton retour trop petit » est couverte par les onglets
  Accueil / Cours (saut n'importe où).
- Premier vrai bout de responsive : le reste des écrans (formulaires, quiz)
  n'a pas été repris — passage mobile complet = phase à part (backlog).
- `getMyCourseOptions()` s'ajoute au coût de rendu de **chaque** page
  `(app)` (3 petites requêtes, `cache()`).
- La barre s'affiche sur toutes les pages `(app)`, y compris les formulaires
  de création (navigation globale toujours dispo).
