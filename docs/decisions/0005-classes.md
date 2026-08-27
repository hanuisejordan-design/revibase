# 0005 — Classes : création, adhésion, isolation

- Statut : accepté
- Date : 2026-08-27

## Contexte

Phase 2 : créer une classe, obtenir un code d'invitation, rejoindre par code,
lister ses classes, page d'une classe. Exigence forte du brief : un
utilisateur ne doit voir que ses classes, sans pouvoir en atteindre une autre
en changeant un identifiant dans l'URL.

## Décision

- **Création et adhésion via RPC `security definer`** (`create_class`,
  `join_class_by_code`, déjà en base) appelées depuis
  `src/features/classes/actions.ts`. Atomicité : classe + adhésion +
  chapitres par défaut en une opération ; le code d'invitation est généré
  côté base (8 caractères hexadécimaux).
- **Isolation** : la garde vit dans `src/app/(app)/class/[classId]/layout.tsx`.
  `getClassContext(classId)` interroge `class_members` filtré sur
  `user_id = auth.uid()` ; si rien → `notFound()` (404). La RLS empêche déjà
  toute lecture hors de ses classes ; le 404 n'est que la couche UI.
- **`getMyClasses()`** filtre explicitement `user_id = auth.uid()` : la RLS de
  `class_members` laisse voir _tous_ les membres de ses classes, donc sans ce
  filtre la liste contenait des doublons (une entrée par co-membre).
- **Quitter une classe** : `leaveClassAction` supprime sa propre ligne
  `class_members` (autorisé par la RLS `members_delete_self_or_trainer`).
  Bouton masqué pour le créateur de la classe.
- **Gestion avancée** (renommer, régénérer le code, gérer les chapitres)
  reportée à la route `class/[classId]/settings` en Phase 3.
- **Notion de « classe active »** volontairement non implémentée : le
  tableau de bord liste les classes, on en choisit une. À ajouter si le
  besoin se confirme (Phase 4+).

## Seed : abandon des INSERT SQL dans `auth.users`

Le `seed.sql` initial créait les comptes par `INSERT` brut dans `auth.users` /
`auth.identities`. Résultat : des lignes que GoTrue (service d'auth Supabase)
ne sait pas relire → `Database error querying schema` à la connexion,
`Database error finding users` sur l'API d'administration, pour TOUS les
comptes ainsi créés.

Remplacé par **`supabase/seed.mjs`** : un script Node qui crée les comptes via
`auth.admin.createUser()` (lignes valides) puis insère les données métier via
PostgREST avec la clé `service_role`. `supabase/cleanup_test_users.sql`
supprime les comptes `@revibase.test` pour repartir de zéro.

## Conséquences

- Un aller-retour SQL de plus pour `getClassContext` (adhésion puis classe) —
  négligeable, indexé, dédupliqué par `cache()`.
- Le seed nécessite Node + `.env.local` (plus seulement l'éditeur SQL), mais
  produit des comptes réellement utilisables.
- Sans types générés depuis Supabase, les lignes renvoyées sont projetées
  manuellement dans des interfaces locales (`features/classes/types.ts`).
