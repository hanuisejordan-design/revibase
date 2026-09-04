import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Bandeau de marque (`bg-brand`) en tête d'une page classe/cours — même
 * traitement que le bandeau du tableau de bord (bleed négatif pour occuper
 * toute la largeur du `<main>`). Fil d'Ariane + nom + petit menu, plutôt
 * qu'un en-tête à plat qui tranche avec le reste de l'app.
 */
export function PageHero({
  backHref,
  backLabel,
  title,
  titleHref,
  nav,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  titleHref: string;
  nav?: ReactNode;
}) {
  return (
    <div className="bg-brand text-brand-foreground -mx-4 -mt-6 flex flex-col gap-1 px-4 pt-4 pb-5 sm:-mx-6 sm:-mt-8 sm:px-6">
      <Link
        href={backHref}
        className="text-brand-foreground/70 hover:text-brand-foreground -ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors"
      >
        <span aria-hidden>←</span> {backLabel}
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link href={titleHref} className="display text-2xl hover:underline">
          {title}
        </Link>
        {nav}
      </div>
    </div>
  );
}

export const heroNavLink =
  "text-brand-foreground/70 hover:text-brand-foreground text-sm transition-colors hover:underline";
