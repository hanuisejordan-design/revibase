# 0004 — Authentification via Supabase Auth

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 1 : inscription, connexion, déconnexion, session persistée, pages
protégées. La stack (ADR 0001) est Next.js 16 + Supabase.

## Décision

- **Supabase Auth**, e-mail + mot de passe. Pas de solution d'auth maison.
- Le nom d'affichage est passé à l'inscription via
  `supabase.auth.signUp({ options: { data: { display_name } } })` ; le
  trigger SQL `handle_new_user` crée la ligne `public.profiles`.
- **Session** gérée par `@supabase/ssr` (cookies). Un fichier
  **`src/proxy.ts`** (voir note Next.js 16 ci-dessous) rafraîchit la session
  à chaque requête.
- **Data Access Layer** `src/lib/auth/dal.ts` :
  - `getUser()` : vérifie la session avec `supabase.auth.getUser()` (le JWT
    est revalidé côté Supabase, contrairement à `getSession()`), lit le
    profil, renvoie `null` si non connecté. Mémoïsé avec `cache()` de React.
  - `requireUser()` : idem mais `redirect('/login')` si non connecté.
- **Groupes de routes** : `(auth)` (login/register, public — redirige les
  connectés vers `/dashboard`) et `(app)` (layout appelant `requireUser()`).
- **Server Actions** (`src/features/auth/actions.ts`) pour toutes les
  mutations d'auth. Validation Zod (`schema.ts`). Messages d'erreur traduits
  en français ; jamais l'erreur brute Supabase renvoyée à l'utilisateur.
- Formulaire client unique `AuthForm` (`mode="login" | "register"`) avec
  `useActionState` pour l'état d'envoi et l'affichage des erreurs par champ.

## Note Next.js 16 : `middleware` → `proxy`

Depuis Next.js 16, le fichier `middleware.ts` s'appelle **`proxy.ts`** (même
rôle, fonction exportée `proxy`). Le projet suit la nouvelle convention :
`src/proxy.ts` + helper `src/lib/supabase/proxy.ts`.

## Gotcha Supabase : privilèges des rôles

Les tables créées via l'éditeur SQL de ce projet n'avaient **aucun GRANT**
pour `authenticated` / `service_role` (« permission denied for table … », et
le nom d'affichage retombait sur l'e-mail). Corrigé par des `GRANT` explicites
(migration 0001 §12, correctif 0003) + `alter default privileges` pour les
futures tables. La RLS reste le filtre fin ; les GRANT n'ouvrent que la porte
au niveau table.

## Alternatives envisagées

- **Auth maison** (JWT + `jose` + table users) : plus de code, plus de
  surface de bug sécurité, aucun gain ici.
- **Protéger les routes uniquement dans `proxy.ts`** : rejeté. Le proxy fait
  au mieux une vérification « optimiste » (cookie) ; la vraie garde se fait
  au plus près des données (`requireUser()` dans les layouts + RLS).
- **`getSession()` au lieu de `getUser()`** : rejeté, `getSession()` ne
  revalide pas le JWT (lecture de cookie seulement).

## Conséquences

- La confirmation d'e-mail est désactivée sur le projet pour faciliter les
  tests ; à réactiver avant une utilisation réelle par une classe.
- `getUser()` fait 1 à 2 requêtes (auth + profil) par rendu, dédupliquées par
  `cache()`. Acceptable ; à surveiller si le nombre de layouts imbriqués
  augmente.
- L'API admin Supabase (`auth.admin.*`) avec la nouvelle clé `sb_secret_…`
  renvoie une erreur 500 en test hors-app — non bloquant pour le MVP (aucun
  usage de l'API admin prévu), à revérifier si le besoin apparaît.
