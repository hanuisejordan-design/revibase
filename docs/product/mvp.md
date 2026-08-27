# Périmètre produit — MVP

## Problème résolu

Sur WhatsApp, une question posée disparaît dans le flux. Revibase la
transforme en **objet permanent** : retrouvable, discutable, réutilisable pour
réviser. Ce n'est pas un remplaçant de WhatsApp ni un clone de Discord : c'est
un outil spécialisé, simple, immédiatement compréhensible.

## Principe UX

L'application se comprend sans tutoriel. Trois actions évidentes :

1. **Poser une question**
2. **Voir les questions**
3. **Faire un quiz**

Pas de serveurs/salons/catégories. Pas de dashboard surchargé.

## Boucle principale

```
difficulté rencontrée
  → question posée (rattachée à un chapitre)
  → réponses des autres étudiants
  → discussion dans le fil de la question
  → une réponse identifiée comme correcte (auteur) / validée (formateur)
  → la question reste dans son chapitre, dans la bibliothèque
  → elle alimente des quiz
  → on révise à partir des vraies difficultés de la classe
```

## Fonctionnalités MVP

- **Auth** : inscription, connexion, déconnexion, nom/pseudonyme.
- **Classes** : créer une classe, rejoindre par code, ne voir que sa classe.
- **Chapitres** : créés/gérés par le formateur ; jeu par défaut à la création.
- **Questions** : créer (titre + contexte + chapitre), lister, consulter,
  rechercher, filtrer par chapitre, trier (récent / populaire / sans réponse).
- **Réponses** : répondre, voter (vote positif simple), voir la plus votée,
  marquer une réponse comme retenue (auteur de la question).
- **Discussion** : un fil de commentaires par question, rattaché pour toujours.
- **Validation formateur** : un formateur valide officiellement une réponse.
  Trois états visibles : non vérifiée / communautaire / validée formateur.
- **Quiz** : choisir un chapitre (ou tous) et un nombre de questions, générer
  le quiz depuis la bibliothèque, répondre, obtenir un score et la liste des
  questions à revoir.

### Nature des questions et quiz

- **Question ouverte** (cas courant) : la réponse de référence est la réponse
  validée par le formateur (retranscription du cours + explication). En quiz :
  **auto-évaluation** — la question s'affiche, l'étudiant réfléchit, l'app
  révèle la réponse de référence, l'étudiant s'auto-note « su / pas su ».
- **QCM** (`kind = mcq`) : prévu (table `question_options`) mais **non actif au
  MVP**. Correction automatique par comparaison. Cf.
  [`../decisions/0003-quiz-auto-evaluation.md`](../decisions/0003-quiz-auto-evaluation.md).

## Rôles et permissions

| Action                                | Étudiant | Formateur |
| ------------------------------------- | :------: | :-------: |
| Lire les données de ses classes       |    ✅    |    ✅     |
| Poser / répondre / commenter / voter  |    ✅    |    ✅     |
| Retenir une réponse (sur sa question) |    ✅    |    ✅     |
| Valider officiellement une réponse    |    —     |    ✅     |
| Gérer les chapitres                   |    —     |    ✅     |

Le rôle est **par classe** (`class_members.role`), pas par compte.

## Hors périmètre (pour l'instant)

Messagerie privée, stories, badges, réputation avancée, classements, profils
sociaux, app mobile native, IA omniprésente, paiement/abonnement, marketplace,
B2B, analytics avancées, multiples types de quiz.

## Critère de réussite

La boucle complète fonctionne de bout en bout : créer une classe → des
camarades rejoignent par code → poser une question dans un chapitre → les
autres répondent, votent, discutent → un formateur valide une réponse → la
question reste dans son chapitre → semaines plus tard, une bibliothèque
existe → lancer un quiz → répondre → obtenir un score.

## Ordre de développement

Phase 0 Initialisation · 1 Auth · 2 Classes · 3 Chapitres · 4 Questions ·
5 Réponses & votes · 6 Discussions · 7 Validation formateur · 8 Quiz ·
9 Notifications · 10 Polissage (UX, responsive, erreurs, a11y, sécurité,
perfs, tests). Chaque phase laisse l'app fonctionnelle.
