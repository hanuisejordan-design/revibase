# 0018 — Résumés par cours

- Statut : accepté
- Date : 2026-08-30
- Voir aussi : [0016](0016-photo-question.md), [0008](0008-questions.md)

## Contexte

Les membres d'un cours ont souvent des fiches / résumés (PDF, notes
manuscrites scannées). Un endroit pour les déposer et les consulter manque,
à côté des questions et des quiz.

## Décision

- **Un résumé = un fichier + un titre**, optionnellement rattaché à un
  chapitre. Table `summaries (course_id, chapter_id nullable, author_id,
  title, file_path, file_name, created_at)`. Pas de table de pièces jointes
  multiples (v2 si besoin).
- **Fichier dans un bucket Storage privé `summaries`**, chemin
  `{course_id}/{uuid}.ext` ; policies `storage.objects` = `is_course_member`
  du premier dossier (même schéma que les photos de question, ADR 0016).
- **RLS `summaries`** : lecture + ajout = membre du cours ; suppression =
  auteur **ou** formateur.
- **Upload côté client** au moment de « Ajouter », sans redimensionnement
  (ce sont des PDF), refus > 20 Mo. L'action ne reçoit que le chemin, vérifie
  le préfixe `{courseId}/`, nettoie le fichier si l'insert échoue.
- **Affichage** : onglet « Résumés » dans la nav du cours ; liste **groupée
  par chapitre** ; aperçu inline (image `<img>`, PDF `<iframe>`) + lien
  « Ouvrir » (URL signée ~1 h) ; bouton Supprimer pour l'auteur / le
  formateur.
- **Pas d'interactions** en v1 : ni vote, ni commentaire.

## Alternatives écartées

- **Texte markdown rédigé dans l'app** (éditable, cherchable) : utile mais
  plus lourd (éditeur, rendu, versionnage) ; les fiches existent surtout sous
  forme de fichiers. Reporté en v2 (`summaries.body`).
- **Plusieurs fichiers par résumé** (`summary_files`) : reporté ; un fichier
  couvre le besoin courant.
- **Réutiliser `question_options` / la mécanique des questions** : sans
  rapport ; les résumés ne nourrissent pas les quiz.

## Conséquences

- **Fichiers orphelins** possibles (upload réussi puis onglet fermé avant
  « Ajouter ») — même dette que les photos (ADR 0016), nettoyage périodique à
  prévoir.
- Un `<iframe>` de PDF peut ne pas s'afficher selon le navigateur / les
  en-têtes ; le lien « Ouvrir » reste le repli.
- Le seed n'ajoute pas de résumé (il faudrait un vrai fichier binaire).
