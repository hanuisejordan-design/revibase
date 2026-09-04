# 0014 — Répondre avant de voir + fusion des doublons exacts

- Statut : accepté
- Date : 2026-08-29
- Voir aussi : [0009](0009-reponses-votes.md), [0010](0010-discussions.md)

## Contexte

Retours d'usage sur les questions **ouvertes** :

1. voir les réponses des autres avant d'avoir répondu pousse à recopier — on
   n'apprend pas et on ne mesure pas ce qu'on sait vraiment ;
2. la même réponse, reformulée à la marge, réapparaît comme une réponse
   distincte : la liste se dilue et on ne voit pas qu'une idée fait consensus.

## Décision

### Masquer les réponses tant qu'on n'a pas participé (questions ouvertes)

- Le formulaire de réponse passe **en premier** ; la liste des réponses est
  remplacée par un encart « N réponses masquées ».
- Bouton d'échappement **« Voir les N réponses sans répondre »** (cas
  révision) — choix assumé de ne pas verrouiller.
- On considère qu'on a « participé » dès qu'on a **répondu**, **voté**, ou vu
  sa réponse **fusionnée** (un vote nous est attribué) → la liste s'affiche
  normalement et repasse au-dessus du formulaire.
- Rien à masquer s'il y a 0 réponse ; QCM / vrai-faux non concernés (la
  « réponse » est l'option correcte, gérée à part).
- Implémentation : `AnswerReveal` (client) enveloppe la `<AnswerList>` rendue
  côté serveur ; l'état « révélé » est purement local, non persisté.

### Fusionner les doublons exacts en un vote

- À la publication d'une réponse, on la compare aux réponses existantes via
  `normalizeAnswerBody` : `trim`, minuscules, espaces multiples réduits,
  ponctuation de fin retirée. **Les accents et les fautes sont conservés** —
  deux orthographes différentes restent deux réponses.
- **Correspondance exacte** → on ne crée pas de doublon : un **vote** de
  l'auteur est ajouté à la réponse existante (`answer_votes`, upsert
  `on conflict do nothing`). Retour : « ta réponse rejoignait celle de X ».
- **Pas de correspondance** → la réponse est créée **et l'auteur vote
  automatiquement** pour elle.
- Le compteur de votes se lit donc désormais « **N personnes donneraient cette
  réponse** » (auteur inclus).
- **Vote anonyme** : on n'affiche **que le total**, pas les noms des votants.
  Un vote est un signal léger (pas une contribution signée comme une réponse
  ou un commentaire) ; exposer qui a soutenu quoi — ou n'a _pas_ soutenu la
  réponse d'un camarade — crée une pression sociale et un effet de meute dans
  une petite classe. `listAnswers` ne renvoie que `voteCount` +
  `viewerHasVoted`, jamais l'identité des votants.
- **Affordance du vote** : le `▲` est remplacé par une **petite pastille 👍**
  — « 👍 N » quand il y a des soutiens, « 👍 Moi aussi » sinon ; pleine quand
  on l'a soutenue (re-clic pour retirer) —, avec une phrase d'aide au-dessus
  de la liste. Objectif : qu'on comprenne qu'on peut soutenir la réponse d'un
  autre même en ayant posté la sienne, et que le compteur monte aussi tout
  seul (auto-vote, fusion). Positif uniquement : pas de « pouce bas » — un 👎
  sur la réponse sincère d'un camarade, dans une petite classe, refroidit la
  participation ; une réponse fausse se traite par la discussion et la
  validation formateur.
- `normalize.ts` est isolé et testé unitairement.

## Alternatives écartées

- **Rapprochement flou / tolérant aux fautes** (distance de Levenshtein,
  stemming…) : trop risqué — fusionnerait des réponses réellement
  différentes. Le vote manuel reste l'outil pour regrouper les quasi-doublons.
- **Fenêtre « fusionner ou publier ? »** à la soumission : friction inutile ;
  si c'est identique au formatage près, on fusionne, point.
- **Masquage strict sans échappatoire** : empêcherait de réviser une question
  déjà traitée.
- **Fusion en base (contrainte d'unicité sur le texte normalisé)** : perdrait
  la formulation d'origine et le `created_at` ; la déduplication applicative
  au moment de la publication suffit.

## Conséquences

- Les réponses créées **avant** cette décision n'ont pas le vote de leur
  auteur : leur compteur peut afficher « 0 » ou omettre l'auteur tant que
  personne n'a voté. Pas de reprise de l'historique.
- L'auteur peut retirer son propre vote (bouton de vote normal) : une réponse
  peut donc afficher « 0 personne » alors que son texte est là — acceptable.
- Deux requêtes de plus à la publication (lecture des réponses existantes,
  écriture du vote) ; négligeable à l'échelle d'une classe.
