# 0003 — Quiz en auto-évaluation au MVP

- Statut : accepté
- Date : 2026-08-27

## Contexte

Le brief demande que le quiz « calcule un score ». Mais les questions sont
ouvertes (réponse rédigée) : il n'existe pas de « bonne case » à comparer.
Un score 100 % automatique n'a pas de définition simple sans IA (explicitement
hors périmètre MVP) ni données structurées.

Distinction relevée avec l'utilisateur : il y a deux natures de questions.

- **Ouvertes** : la réponse de référence = une retranscription du cours +
  explication, validée par le formateur.
- **QCM** : il « suffit » de cocher la bonne proposition → correction
  automatique évidente.

## Décision

**MVP : mode `self_assessment` (auto-évaluation / flashcard).**

1. Le générateur tire des questions de la classe (par chapitre ou toutes),
   en priorité celles qui ont une **réponse validée** (sinon la plus votée).
2. Pour chaque question : affichage de l'intitulé → l'étudiant réfléchit →
   il révèle la réponse de référence → il s'auto-note **« su » / « pas su »**
   (`quiz_answers.knew_it`).
3. Score = nombre de « su » / total. Les « pas su » forment la liste
   « à revoir ».

**Prévu, non actif : mode `mcq`.** La table `question_options` et le champ
`quiz_answers.selected_answer_id` existent déjà. Quand une question
`kind = mcq` aura des propositions, le quiz comparera directement le choix à
`is_correct`. À activer en Phase 8 si le besoin est confirmé.

## Alternatives envisagées

- **QCM auto-corrigé uniquement**, en fabriquant de faux choix à partir des
  autres réponses. Rejeté pour le MVP : inutilisable tant qu'il n'y a pas
  beaucoup de questions avec réponse validée ; qualité des distracteurs
  incertaine.
- **Correction par IA d'une réponse libre.** Hors périmètre MVP (le cœur du
  produit doit fonctionner sans IA).
- **Pas de score du tout, simple relecture.** Ne répond pas à la demande
  « afficher le score à la fin ».

## Conséquences

- Le score reflète une auto-évaluation honnête, pas une correction objective —
  assumé et cohérent avec un outil de révision entre pairs.
- Aucune dette : le chemin QCM est déjà présent dans le schéma.
- Le générateur de quiz (`services/quiz-generator/`) doit gérer le cas « moins
  de questions disponibles que demandé » proprement.
