# 0029 — Identité visuelle : bleu encre, papier froid, serif éditorial

- Statut : accepté
- Date : 2026-09-04

## Contexte

Jusqu'ici l'app utilisait la palette Tailwind brute (`zinc-*`, `bg-white`)
avec des variantes `dark:` posées à la main partout. Cohérent mais neutre,
et lourd à maintenir (deux jeux de couleurs à garder synchro sur chaque
élément). On voulait une vraie identité — quelque chose qui « donne envie
de réviser » sans en faire trop — et un seul endroit où régler les
couleurs.

## Décision

### Couche de tokens (`src/app/globals.css`)

Variables CSS de marque définies une fois en `:root`, redéfinies sous
`@media (prefers-color-scheme: dark)` **et** `:root[data-theme="dark"]`
(le sélecteur du toggle), puis exposées à Tailwind via `@theme inline` :

| token                                | clair                 | sombre                | usage                                     |
| ------------------------------------ | --------------------- | --------------------- | ----------------------------------------- |
| `--background`                       | `#f1f3f6`             | `#14181a`             | fond de page (papier froid, léger bleuté) |
| `--surface` / `--surface-foreground` | `#ffffff` / `#1a1d22` | `#1c2123` / `#ececea` | cartes                                    |
| `--foreground`                       | `#1a1d22`             | `#ececea`             | texte principal                           |
| `--muted`                            | `#676e7a`             | `#9a9a92`             | texte secondaire                          |
| `--border`                           | `#e3e6ec`             | `#2b3134`             | filets                                    |
| `--brand` / `--brand-hover`          | `#1f3a5f` / `#182f4d` | `#5b8bc4` / `#6d9bd0` | bandeaux, boutons pleins, petits titres   |
| `--brand-foreground`                 | `#f1f3f6`             | `#0f1211`             | texte sur `--brand`                       |
| `--accent`                           | `#35618e`             | `#7ba7d7`             | points, petits accents                    |

Classes Tailwind correspondantes : `bg-background`, `bg-surface`,
`text-foreground`, `text-muted`, `border-border`, `bg-brand`,
`text-brand-foreground`, `hover:bg-brand-hover`, `text-accent`…
**Plus aucune variante `dark:` de couleur** dans le code : les tokens
basculent seuls.

### Typographie

- Corps : **Geist** (`--font-sans`) — volontairement classique, l'app
  sert à lire.
- Titres de section : **Fraunces** (`--font-serif`) via l'utilitaire
  `.display` — serif éditorial sobre.
- **Manuscrite « craie sur tableau » : Gloria Hallelujah**
  (`--font-hand`, utilitaire `.greeting`), **uniquement** pour le
  « Bonjour X. » du tableau de bord. Toutes trois chargées par
  `next/font/google` dans `app/layout.tsx`.

### Icônes

`lucide-react` partout, plus aucun emoji ni glyphe symbole (`👍` →
`ThumbsUp`, `✓` → `Check`, `↑↓` → `ArrowUp`/`ArrowDown`, `📷` →
`ImageIcon`, `★` → `Star`…). Restent quelques flèches typographiques
`←` / `→` dans les liens « retour » — cosmétique, à finir.

### Conventions de conversion (appliquées à tout l'existant)

- `bg-white` → `bg-surface` ; `bg-zinc-50/100` → `bg-background` ;
  `bg-zinc-900` (bouton plein) → `bg-brand` + `text-brand-foreground`.
- `text-zinc-900` → `text-foreground` ; `text-zinc-400…700` →
  `text-muted`.
- `border-zinc-200/300` → `border-border` ; **survol** de bordure
  (`hover:border-zinc-400`) → `hover:border-brand/40` (garde
  l'affordance) ; puce / bouton **actif** → `bg-brand`.
- Couleurs **de statut conservées** : vert (validé), ambre (nouvelles
  questions / sans réponse), emerald (nouveaux résumés), violet (défi),
  indigo (retenue), rose (badge « Formateur »), rouge (erreurs /
  suppression).
- Badge **« Formateur »** : était en `bg-brand/10 text-brand` sur la
  vignette de cours (se fondait avec le bleu de marque) et en `sky` dans
  la liste des membres — unifié en **rose** (`bg-rose-100 text-rose-800`)
  aux deux endroits, clairement distinct du bleu.

## Alternatives écartées

- **Vert pin `#1f4436` + papier chaud `#f4f2ec`** (V0) : le crème chaud
  et un accent froid se tiraient dessus. Garder le vert aurait imposé un
  fond chaud.
- **Bleu-vert pétrole `#1c5c5c`** : sympa, plus « vivant », mais
  l'utilisateur a préféré le bleu encre, plus posé.
- **Caveat** pour le « Bonjour » : trop « feutre », remplacé par Gloria
  Hallelujah (plus proche de la craie).
- **Garder les `dark:` manuels** : deux fois plus de classes à écrire et
  à ne pas oublier.

## Conséquences

- Un seul fichier (`globals.css`) pour rééquilibrer toute la charte.
- Les nouveaux composants doivent utiliser les tokens, jamais
  `zinc-*` / `bg-white` / `dark:` de couleur.
- `docs/architecture/overview.md` § « Identité visuelle » résume l'état ;
  la mémoire projet garde l'historique des essais.
- Reste : convertir les flèches `←`/`→` des liens retour en `lucide`.
