# Revibase

Plateforme communautaire de révision pour une classe. Les étudiants posent des
questions, y répondent, en discutent dans un fil rattaché à la question, votent,
identifient une réponse correcte, rangent chaque question dans un chapitre, et
génèrent des quiz à partir de la bibliothèque de questions accumulée.

L'idée centrale : **une question posée ne se perd pas dans un fil de discussion.
Elle devient un objet permanent, retrouvable et réutilisable pour réviser.**

Premier terrain d'utilisation : une promotion de formation de conducteur de train.

## Stack

| Domaine     | Choix                                                 |
| ----------- | ----------------------------------------------------- |
| Framework   | Next.js 16 (App Router) + React 19, TypeScript strict |
| Style       | Tailwind CSS v4                                       |
| Base & Auth | Supabase (PostgreSQL, Auth, Row Level Security)       |
| Validation  | Zod                                                   |
| Tests       | Vitest + Testing Library                              |
| Hébergement | Vercel (app) + Supabase (base)                        |

Détails et justification : [`docs/decisions/0001-stack.md`](docs/decisions/0001-stack.md).

## Prérequis

- **Node.js ≥ 22** (`.nvmrc` fourni ; `nvm use`). Node 20 fonctionne mais
  déclenche des avertissements de version sur certaines dépendances.
- npm ≥ 10
- Un projet Supabase (gratuit) — voir ci-dessous.

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs Supabase
```

### Variables d'environnement

Dans le tableau de bord Supabase → _Project Settings_ :

| Variable                        | Où la trouver                 | Exposée au navigateur  |
| ------------------------------- | ----------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Data API → Project URL        | oui                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API Keys → clé `anon`         | oui (protégée par RLS) |
| `SUPABASE_SERVICE_ROLE_KEY`     | API Keys → clé `service_role` | **non — secrète**      |

> Ces variables ne sont réellement nécessaires qu'à partir de la Phase 1
> (authentification). La page d'accueil actuelle fonctionne sans.

**Notifications push (optionnel, Phase 23)** — générer une paire avec
`npx web-push generate-vapid-keys`, puis renseigner `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
(publique), `VAPID_PRIVATE_KEY` (**secrète**, à mettre dans les variables
Vercel) et `VAPID_SUBJECT` (`mailto:` de contact). Sans elles, l'app tourne
et le push est simplement désactivé. Détails : [`docs/decisions/0023-pwa-push.md`](docs/decisions/0023-pwa-push.md).

### Base de données

**1. Schéma** — dans _SQL Editor_ (Supabase Studio), exécuter **dans l'ordre**
le contenu de chaque fichier de [`supabase/migrations/`](supabase/migrations)
(`0001`, `0002`, `0003`, …). Le `0001` à jour se suffit à lui-même pour un
projet neuf ; `0002` et `0003` ne servent que si `0001` a été appliqué avant
leurs correctifs (voir l'en-tête de chaque fichier).

**2. Données de démo (optionnel)** — après avoir renseigné `.env.local` :

```bash
node --env-file=.env.local supabase/seed.mjs
```

Le script crée des comptes de test (`*.@revibase.test`, mot de passe
`password123`) via l'API d'administration Supabase, puis une classe d'exemple
(code `DEMO2026`) avec chapitres, questions et réponses.

> `supabase/cleanup_test_users.sql` supprime tous les comptes `@revibase.test`
> (utile pour repartir de zéro ; à coller dans _SQL Editor_).

## Lancer le projet

```bash
npm run dev        # http://localhost:3000
```

## Déploiement

Vercel + Supabase. Marche à suivre : [`docs/deployment.md`](docs/deployment.md).

## Scripts

| Script                 | Effet                                    |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Serveur de développement                 |
| `npm run build`        | Build de production                      |
| `npm start`            | Sert le build de production              |
| `npm run lint`         | ESLint                                   |
| `npm run typecheck`    | Vérification TypeScript (`tsc --noEmit`) |
| `npm run format`       | Formatage Prettier (écriture)            |
| `npm run format:check` | Vérifie le formatage sans modifier       |
| `npm test`             | Tests Vitest (une passe)                 |
| `npm run test:watch`   | Tests en mode watch                      |

## Structure

```
src/
├── app/            Routes (App Router) et pages
├── components/     UI : primitives (ui/) + composants par domaine
├── features/       Logique par domaine : schema.ts / queries.ts / actions.ts
├── lib/            Config partagée : supabase/, auth/, validation/, utils/, env.ts
├── services/       Logique métier transverse : quiz-generator/, notifications/
├── types/          Types de domaine partagés
└── constants/      Constantes et énumérations

supabase/
├── migrations/     Schéma SQL versionné
└── seed.mjs        Données de démonstration (script Node)

docs/
├── architecture/   Vue d'ensemble technique
├── decisions/      Décisions techniques (ADR)
└── product/        Périmètre produit / MVP
```

Chaque dossier `features/*` et `components/*` a son propre `README.md`.

## Tests

```bash
npm test
```

Les tests couvriront en priorité les règles métier et de sécurité :
authentification, appartenance aux classes, permissions entre classes,
votes, validation formateur, calcul du score de quiz.

## Feuille de route

Le développement suit des phases laissant l'app fonctionnelle à chaque étape : 0. Initialisation ✅ · 1. Authentification ✅ · 2. Classes ✅ · 3. Chapitres ✅ · 4. Questions ✅ · 5. Réponses & votes ✅ · 6. Discussions ✅ · 7. Validation formateur ✅ · 8. Quiz ✅ · 9. Notifications ✅ · 10. Polissage.

**Post-MVP :** 11. Types de question (ouverte / vrai-faux / QCM) ✅ avec quiz auto-corrigés · 12. Répondre avant de voir les autres réponses + fusion des doublons exacts en vote + discussion en bulles ✅ · 13. Groupes (une promo chapeaute plusieurs cours) ✅ · 14. Photo attachée à une question ✅ · 15. Renommage groupe → **classe** → **cours** + refonte du tableau de bord ✅ · 16. Résumés par cours (dépôt de fiches / PDF) ✅ · 17. Favori privé sur les résumés ✅ · 18. Rôles du cours : admin ≠ formateur ✅ · 19. Éditer une question ✅ · 20. Vignettes de cours : compteurs questions / résumés ✅ · 21. Centre de notifications ✅ · 22. Nouveautés depuis la dernière visite : questions & résumés ✅ · 23. PWA installable + notifications push ✅ · 24. Suivi de lecture par élément (nouveautés) ✅ · 25. Page Paramètres + thème clair / sombre ✅ · 26. Intention d'une question (besoin d'aide / défi) ✅

La boucle MVP est en ligne et testée en conditions réelles.

- Périmètre & critères : [`docs/product/mvp.md`](docs/product/mvp.md)
- Idées et reports (types de question, photos, responsive…) : [`docs/product/backlog.md`](docs/product/backlog.md)
