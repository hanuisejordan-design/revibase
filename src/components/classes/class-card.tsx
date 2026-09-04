import Link from "next/link";
import type { ClassSummary } from "@/features/classes/types";

const amberBadge =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300";
const greenBadge =
  "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";

/** Carte d'une classe sur le tableau de bord : aperçu + entrée vers ses cours. */
export function ClassCard({ cls }: { cls: ClassSummary }) {
  const courseCount = cls.courses.length;
  return (
    <Link
      href={`/class/${cls.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-surface-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-brand/40"
    >
      <span className="font-medium">{cls.name}</span>
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
        {cls.newQuestionCount > 0 ? (
          <span className={amberBadge}>
            {cls.newQuestionCount} nouvelle{cls.newQuestionCount > 1 ? "s" : ""} question
            {cls.newQuestionCount > 1 ? "s" : ""}
          </span>
        ) : null}
        {cls.newSummaryCount > 0 ? (
          <span className={greenBadge}>
            {cls.newSummaryCount} nouveau{cls.newSummaryCount > 1 ? "x" : ""} résumé
            {cls.newSummaryCount > 1 ? "s" : ""}
          </span>
        ) : null}
        <span>
          {courseCount === 0 ? "Aucun cours" : `${courseCount} cours`} · {cls.memberCount} membre
          {cls.memberCount > 1 ? "s" : ""}
          {cls.isAdmin ? " · admin" : ""}
        </span>
      </span>
    </Link>
  );
}
