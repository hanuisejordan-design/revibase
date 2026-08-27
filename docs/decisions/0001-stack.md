# 0001 — Choix de la stack

- Statut : accepté
- Date : 2026-08-27

## Contexte

Premier projet SaaS web complet, mené comme projet d'apprentissage. Besoins :
authentification, données relationnelles (classes, questions, réponses,
votes, quiz), isolation stricte entre classes, mobile-first, socle prêt pour
des notifications et du temps réel. Contrainte : rester simple, éviter la
sur-ingénierie, pouvoir déployer gratuitement pour une classe.

## Décision

**Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + Supabase
(PostgreSQL, Auth, RLS), déployé sur Vercel.**

- Un seul langage (TypeScript) du front au back.
- Server Components pour les lectures, Server Actions pour les écritures :
  la logique d'accès aux données s'isole naturellement dans `features/`.
- Supabase fournit l'auth et une base PostgreSQL avec **Row Level Security** :
  l'exigence « pas d'accès à une autre classe » s'écrit une fois dans la base.
- Zod pour valider les entrées. Vitest + Testing Library pour les tests.

## Alternatives envisagées

- **Next.js + Prisma + PostgreSQL auto-hébergé + Auth.js.** Plus « classique »,
  on apprend l'ORM et les migrations à la main. Écarté pour le MVP : plus de
  plomberie (auth, hébergement base), et les permissions deviennent du code
  applicatif à ne pas oublier plutôt qu'une règle centralisée. Le schéma
  restant portable, une bascule ultérieure reste possible.
- **SvelteKit / autres.** Écosystème et documentation moins fournis pour un
  premier projet.
- **Discord / outil existant.** Rejeté par le brief : trop générique, courbe
  d'apprentissage (serveurs, salons), ne capitalise pas les questions.

## Conséquences

- Il faut apprendre la RLS PostgreSQL (courbe réelle mais bornée) — c'est
  aussi la brique de sécurité centrale, donc un bon investissement.
- Dépendance à Supabase pour l'auth ; la base reste du PostgreSQL standard.
- Le palier gratuit Vercel est non commercial : suffisant pour une classe,
  à réévaluer en cas d'usage élargi.
- Next.js 16 introduit des changements par rapport aux versions antérieures :
  se référer à la doc embarquée `node_modules/next/dist/docs/` avant d'écrire
  du code spécifique au framework.
- Node.js ≥ 22 recommandé (dépendances récentes). `.nvmrc` fourni.
