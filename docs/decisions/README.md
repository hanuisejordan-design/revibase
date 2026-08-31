# Décisions techniques (ADR)

Un **ADR** (Architecture Decision Record) est une note courte qui fige une
décision importante : le contexte, le choix retenu, les alternatives, les
conséquences. On en écrit un quand un choix serait coûteux à revoir ou
difficile à comprendre plus tard.

## Format

Un fichier `NNNN-titre-court.md` :

```
# NNNN — Titre

- Statut : proposé | accepté | remplacé par 00XX
- Date : AAAA-MM-JJ

## Contexte
Pourquoi la question se pose.

## Décision
Ce qu'on fait.

## Alternatives envisagées
Ce qu'on ne fait pas, et pourquoi.

## Conséquences
Ce que cela implique (bon et moins bon).
```

Une décision n'est jamais réécrite : si elle change, on ajoute un nouvel ADR
qui remplace l'ancien (et on met à jour le statut de l'ancien).

## Index

| #    | Titre                                                                      | Statut            |
| ---- | -------------------------------------------------------------------------- | ----------------- |
| 0001 | [Choix de la stack](0001-stack.md)                                         | accepté           |
| 0002 | [Modèle de données](0002-modele-donnees.md)                                | accepté           |
| 0003 | [Quiz en auto-évaluation](0003-quiz-auto-evaluation.md)                    | accepté           |
| 0004 | [Authentification via Supabase Auth](0004-authentification.md)             | accepté           |
| 0005 | [Classes : création, adhésion, isolation](0005-classes.md)                 | accepté           |
| 0006 | [Chapitres : gestion par le formateur](0006-chapitres.md)                  | remplacé par 0007 |
| 0007 | [Chapitres gérables par tout membre](0007-chapitres-tout-membre.md)        | accepté           |
| 0008 | [Questions : liste, filtres, détail](0008-questions.md)                    | accepté           |
| 0009 | [Réponses & votes](0009-reponses-votes.md)                                 | accepté           |
| 0010 | [Discussions](0010-discussions.md)                                         | accepté           |
| 0011 | [Validation formateur](0011-validation-formateur.md)                       | accepté           |
| 0012 | [Quiz](0012-quiz.md)                                                       | accepté           |
| 0013 | [Types de question (ouverte / vrai-faux / QCM)](0013-types-de-question.md) | accepté           |
| 0014 | [Répondre avant de voir + fusion des doublons](0014-reponse-avant-de-voir-et-fusion-doublons.md) | accepté |
| 0015 | [Groupes : une couche au-dessus des classes](0015-groupes.md) | accepté |
| 0016 | [Photo attachée à une question](0016-photo-question.md) | accepté |
| 0017 | [Renommage groupe → classe → cours](0017-renommage-groupe-classe-cours.md) | accepté |
| 0018 | [Résumés par cours](0018-resumes-par-cours.md) | accepté |
| 0019 | [Rôles d'un cours : admin ≠ formateur](0019-roles-cours-admin-formateur.md) | accepté |
| 0020 | [Édition d'une question](0020-edition-question.md) | accepté |
| 0021 | [Centre de notifications](0021-notifications.md) | accepté |
| 0022 | [Nouvelles questions depuis la dernière visite](0022-nouvelles-questions.md) | accepté |
