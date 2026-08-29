# 0016 — Photo attachée à une question

- Statut : accepté
- Date : 2026-08-29
- Voir aussi : [0008](0008-questions.md), [0005](0005-classes.md)

## Contexte

Le domaine est très visuel (signaux, panneaux, matériel, schémas). Poser une
question à partir d'une image — « que signifie ce signal ? » — est un besoin
récurrent.

## Décision

- **Une image par question** (`questions.image_path text`). Plusieurs images
  ou images sur les réponses : reporté (`question_attachments` si besoin).
- **Supabase Storage, bucket privé `question-images`.** Chemin
  `{class_id}/{uuid}.jpg` : le premier dossier permet aux policies
  `storage.objects` de vérifier `is_class_member((storage.foldername(name))[1])`
  (select / insert / delete réservés aux membres de la classe).
- **Affichage par URL signée** (~1 h), générée côté serveur dans la couche
  `queries` (`createSignedUrls` en lot pour les listes). Pas de bucket public
  ni d'URL devinable.
- **Redimensionnement navigateur** avant envoi (`canvas` → JPEG ~1600 px,
  qualité 0.8) : une photo de téléphone de ~5 Mo tombe à ~300 Ko —
  économise stockage et bande passante, et l'upload reste rapide en 4G.
- **Upload à la publication**, pas au choix du fichier : le client
  redimensionne puis téléverse vers Storage juste avant d'appeler la Server
  Action, qui reçoit seulement le chemin. Évite les fichiers orphelins quand
  on abandonne le formulaire.
- `createQuestionAction` ne garde le chemin que s'il est préfixé par
  `{classId}/` ; il supprime l'image si l'insert échoue.

## Alternatives écartées

- **Bucket public + noms de fichiers aléatoires** : plus simple (pas d'URL
  signée), mais une URL qui fuite reste accessible indéfiniment. Le contenu
  d'une classe n'a pas à être lisible hors de la classe.
- **Image envoyée dans la Server Action (multipart)** : ferait transiter les
  octets par le serveur Next (limite de taille des Server Actions à relever)
  sans bénéfice — le client sait déjà téléverser directement vers Storage.
- **Pas de redimensionnement** : photos de 5–10 Mo, stockage et affichage
  lents, surtout sur mobile.
- **`next/image`** : demande de déclarer le domaine distant et un
  optimiseur ; pour des vignettes et une image de détail, `<img>` suffit.

## Conséquences

- **Fichiers orphelins résiduels** : si l'upload réussit mais que l'onglet
  est fermé avant « Publier », l'image reste dans le bucket sans question.
  Rare ; nettoyage périodique à prévoir (backlog).
- La suppression **douce** d'une question ne supprime pas son image (la
  ligne existe toujours). Un vrai `DELETE` devrait, le cas échéant.
- Une URL signée expire : un onglet laissé ouvert > 1 h affichera une image
  cassée jusqu'au rechargement. Acceptable.
- Le seed n'inclut pas de photo (il faudrait un vrai fichier binaire).
