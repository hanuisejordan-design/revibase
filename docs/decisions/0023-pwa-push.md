# 0023 — PWA installable + notifications push

- Statut : accepté
- Date : 2026-08-31
- Voir aussi : [0021](0021-notifications.md), [0022-nouvelles-questions.md](0022-nouvelles-questions.md)

## Contexte

L'app est utilisée surtout au téléphone. On veut : une icône sur l'écran
d'accueil (ouverture plein écran), et de **vraies notifications système**
(« bulles ») même quand l'app est fermée — pour tous les signaux : réponse,
commentaire, validation, nouvelle question, nouveau résumé.

## Décision

### PWA

- `app/manifest.ts` (`display: standalone`, `start_url: /dashboard`, thème
  zinc, icônes 192 / 512 / maskable dans `public/`). Icône provisoire
  (monogramme « R », `scripts/gen-icons.mjs` via `sharp`) — à remplacer par
  un vrai visuel plus tard.
- Pas de cache offline. Le service worker `public/sw.js` ne sert **que** le
  push (`push` → `showNotification`, `notificationclick` → focus/ouvre l'URL).
  En-têtes `no-store` + `Service-Worker-Allowed: /` (`next.config.ts`).
- Sur iOS l'installation est manuelle (Partager → « Sur l'écran d'accueil ») :
  un encart l'explique.

### Web Push

- **Clés VAPID** : `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client, inlinée),
  `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` (serveur, secrets Vercel).
  Variables **optionnelles** : sans elles, l'app tourne, le push est
  simplement désactivé (`pushConfigured()` / `PushToggle` → « non
  disponible »).
- **Migration `0020`** : table `push_subscriptions (user_id, endpoint unique,
  p256dh, auth, user_agent)`, privée (RLS `user_id = auth.uid()`). Deux
  fonctions `security definer` pour l'envoi : `list_push_targets(uuid[])`
  (abonnements des destinataires) et `delete_push_subscription_by_endpoint`
  (purge des abonnements périmés 404/410).
- **Abonnement** : `PushToggle` (client, en tête de `/notifications`)
  enregistre le SW, demande la permission, `pushManager.subscribe(...)`,
  puis `subscribeToPushAction`. Un abonnement **par appareil** (clé
  `endpoint`). Bouton Activer / Désactiver ; états gérés : non supporté,
  iOS-à-installer, refusé.
- **Envoi = depuis les Server Actions**, pas les triggers. Chaque action qui
  produit un signal appelle `sendPushToUsers()` dans un `after()` (post
  réponse, non bloquant) :

  | Action | Destinataire | Type |
  | --- | --- | --- |
  | `createAnswerAction` (vraie insertion) | auteur de la question | échange |
  | `createCommentAction` | auteur de la question | échange |
  | `toggleValidateAction` (passage à validé) | auteur de la réponse | échange |
  | `createQuestionAction` | membres du cours (− auteur) | nouveauté |
  | `createSummaryAction` | membres du cours (− auteur) | nouveauté |

  `courseAudience()` = `course_members` ∪ `class_members` (via
  `courses.class_id`).
- **Best-effort assumé** : la notif in-app (triggers, ADR 0021) et les
  pastilles `course_reads` (ADR 0022) restent la source de vérité. Si un
  futur chemin d'écriture oublie le push, rien n'est perdu côté in-app.
- `web-push` (Node) ; envoi en `Promise.allSettled`, purge des endpoints
  morts au passage.

## Alternatives écartées

- **Supabase Edge Function + webhook DB** sur `notifications` : le push
  suivrait exactement les triggers, mais impose la CLI Supabase, une
  fonction Deno à déployer et la clé VAPID en secret Supabase. Trop lourd
  pour le gain, vu que l'in-app est déjà garanti.
- **Envoi depuis les triggers Postgres** : impossible (pas de HTTP sortant
  sans `pg_net` + Edge Function).
- **Cache offline / Serwist** : hors scope ; le SW ne fait que du push.
- **Notif in-app `new_question` / `new_summary`** (lignes `notifications`) :
  toujours écartée (cf. 0022) ; le push, lui, cible les membres à la volée
  sans stocker N lignes.

## Conséquences

- **iOS** : le push ne fonctionne **que** si l'app est installée sur l'écran
  d'accueil (iOS 16.4+). En onglet Safari : rien.
- Permission refusée = pas de push pour cet appareil tant que l'utilisateur
  ne la réautorise pas dans les réglages de l'OS.
- La clé privée VAPID est un secret de déploiement : jamais commitée,
  présente seulement dans `.env.local` (gitignore) et les variables Vercel.
- Un appareil peut garder un abonnement périmé ; il est purgé au premier
  envoi qui échoue (410).
- Le `title` de la bulle = le nom de l'auteur ; le `body` = l'action. Pas de
  regroupement (un signal = une bulle).
