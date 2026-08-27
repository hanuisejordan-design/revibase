# Déploiement (Vercel)

L'app est un projet Next.js standard : Vercel la détecte et la build sans
configuration. Il faut seulement fournir les variables d'environnement
Supabase.

## 1. Mettre le code sur GitHub

Crée un dépôt **vide et privé** sur <https://github.com/new> (nom : `revibase`,
sans README ni .gitignore). Puis, à la racine du projet (`revibase/`) :

```bash
git remote add origin https://github.com/<ton-compte>/revibase.git
git branch -M main
git push -u origin main
```

## 2. Importer dans Vercel

1. <https://vercel.com> → **Add New… → Project** → importe le dépôt `revibase`.
2. Framework **Next.js** (auto-détecté). Root Directory : `.` (ne rien changer).
3. **Environment Variables** — ajoute (valeurs à copier depuis `revibase/.env.local`) :

   | Nom                             | Requis  | Rôle                                                                                                    |
   | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | **oui** | URL du projet Supabase                                                                                  |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **oui** | clé publique (protégée par la RLS)                                                                      |
   | `SUPABASE_SERVICE_ROLE_KEY`     | non     | clé secrète — inutile au runtime actuel, à ajouter (masquée) si tu prévois des tâches d'admin plus tard |

4. **Deploy**. Vercel te donne une URL `https://revibase-xxx.vercel.app`.

À chaque `git push` sur `main`, Vercel redéploie automatiquement.

> Sans GitHub : `npx vercel` depuis `revibase/` (connexion navigateur,
> répondre aux questions, dossier `.`), ajouter les variables dans le
> dashboard, puis `npx vercel --prod`.

## 3. Côté Supabase

- L'app déployée utilise le **même projet Supabase** que tes tests. C'est
  suffisant pour un premier essai avec ta classe.
- **Avant de partager le lien** : nettoie les comptes de test → SQL Editor →
  exécute `supabase/cleanup_test_users.sql` (supprime les comptes
  `@revibase.test` et la classe de démo ; ton compte perso reste).
- **Rien d'autre à configurer** : l'auth se fait par e-mail + mot de passe,
  sans e-mail de confirmation ni OAuth → aucune URL de redirection à
  déclarer. Si tu réactives la confirmation d'e-mail plus tard, ajoute
  l'URL Vercel dans _Authentication → URL Configuration → Redirect URLs_.

## 4. Vérifier après déploiement

Sur l'URL Vercel, refais la boucle : créer un compte → créer une classe →
inviter (partager le code) → poser une question → répondre / voter →
valider → lancer un quiz. Teste aussi **sur téléphone** (cible n°1 ; le
responsive sera poli en Phase 10 mais doit déjà être utilisable).

## Notes

- **Vercel Hobby** (gratuit) : usage non commercial — OK pour une classe.
- **Node** : Vercel respecte `.nvmrc` (Node 22).
- **Migrations** : elles ne partent pas avec le déploiement. Toute évolution
  du schéma se fait à la main dans le SQL Editor Supabase (fichiers de
  `supabase/migrations/`).
