"use client";

import type { ReactNode } from "react";
import { markSummaryReadAction } from "@/features/reads/actions";

/**
 * Lien vers le fichier d'un résumé qui marque celui-ci comme lu au clic (avant
 * d'ouvrir le nouvel onglet). Un résumé ne quitte les « nouveautés » que
 * lorsqu'on l'a réellement ouvert.
 */
export function SummaryReadLink({
  summaryId,
  href,
  className,
  children,
}: {
  summaryId: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        markSummaryReadAction(summaryId).catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
