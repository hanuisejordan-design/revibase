# 0025 — Page Paramètres + thème clair / sombre

- Statut : accepté
- Date : 2026-08-31

## Contexte

Les réglages étaient éparpillés : « Se déconnecter » et le nom dans l'en-tête,
l'activation des notifications au-dessus de la liste `/notifications`, les
codes d'invitation seulement sur la page d'une classe. L'app suivait le thème
de l'OS sans possibilité de forcer clair ou sombre.

## Décision

- **Page `/parametres`** (groupe `(app)`), atteinte via le nom dans
  l'en-tête (`Nom ⚙`). Sections :
  - **Thème** — bascule 3 états Système / Clair / Sombre.
  - **Notifications** — le `PushToggle` y est déplacé (la page
    `/notifications` renvoie un lien vers Paramètres).
  - **Mes codes d'invitation** — liste « classe → code » (`getMyClasses`).
  - **Compte** — nom, e-mail, « Se déconnecter » (retiré de l'en-tête).
- **Thème** :
  - Préférence dans `localStorage` (`theme` = `system|light|dark`).
  - « système » = **aucun attribut** sur `<html>` → une media query CSS
    (`prefers-color-scheme`) pilote, y compris les changements d'OS en
    direct, sans JS.
  - « clair » / « sombre » posent `data-theme` sur `<html>`.
  - `@custom-variant dark` (Tailwind v4) matche `[data-theme="dark"]` **ou**
    (`prefers-color-scheme: dark` sans `[data-theme="light"]`).
  - `ThemeWatcher` (client, monté dans le layout racine) applique la
    préférence stockée **après hydratation**. Le SSR ne pose jamais
    l'attribut ⇒ pas de décalage d'hydratation, pas d'avertissement console.
    Bref flash possible uniquement pour qui force un thème opposé à son OS —
    accepté.
- **Navigation** : les liens de retour (`← Tableau de bord`, `← {classe}`)
  passent en `text-sm` avec zone cliquable élargie (ils étaient trop petits).

## Alternatives écartées

- **Script inline anti-flash dans `<head>`** : provoque en Next 16 / React 19
  l'avertissement « script tag in React component » et un décalage
  d'hydratation sur `data-theme`. Le combo media-query (système) +
  application post-hydratation (choix explicite) évite les deux.
- **Menu déroulant sur le pseudo** : trop à l'étroit pour le bloc
  notifications et la liste des codes.
- **Barre de navigation basse (mobile, accès pouce)** avec onglets Cours /
  `+` / notifs / profil : bonne idée, mais c'est une phase à part (recouvre
  le passage responsive mobile). Notée au backlog.

## Conséquences

- Un seul point d'entrée pour les réglages ; l'en-tête s'allège
  (`🔔  ·  Nom ⚙`).
- Le thème est mémorisé par appareil (localStorage), pas synchronisé entre
  appareils.
