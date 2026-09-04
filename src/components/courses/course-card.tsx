import Link from "next/link";
import type { CourseSummary } from "@/features/courses/types";

const newQuestionBadge =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300";
const newSummaryBadge =
  "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";

/**
 * Carte d'un cours.
 * - `compact` (page d'une classe, grille 2 colonnes) : en dessous de `sm`,
 *   badge « Formateur » masqué, badges « nouv. » abrégés, compteur membres
 *   masqué.
 * - défaut (tableau de bord) : rendu complet, comme la carte d'une classe.
 */
export function CourseCard({
  course,
  compact = false,
}: {
  course: CourseSummary;
  compact?: boolean;
}) {
  const q = `${course.questionCount} question${course.questionCount > 1 ? "s" : ""}`;
  const r = `${course.summaryCount} résumé${course.summaryCount > 1 ? "s" : ""}`;
  const m = `${course.memberCount} membre${course.memberCount > 1 ? "s" : ""}`;
  const nq = `${course.newQuestionCount} nouvelle${course.newQuestionCount > 1 ? "s" : ""} question${
    course.newQuestionCount > 1 ? "s" : ""
  }`;
  const ns = `${course.newSummaryCount} nouveau${course.newSummaryCount > 1 ? "x" : ""} résumé${
    course.newSummaryCount > 1 ? "s" : ""
  }`;

  const trainerCls = `${compact ? "hidden sm:inline-flex" : "inline-flex"} items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300`;

  return (
    <Link
      href={`/course/${course.id}`}
      className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-surface-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-brand/40"
    >
      <span className="font-medium">{course.name}</span>
      <span className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
        {course.role === "trainer" ? <span className={trainerCls}>Formateur</span> : null}

        {course.newQuestionCount > 0 ? (
          <span className={newQuestionBadge}>
            {compact ? (
              <>
                <span className="hidden sm:inline">{nq}</span>
                <span className="sm:hidden">{`${course.newQuestionCount} nouv.`}</span>
              </>
            ) : (
              nq
            )}
          </span>
        ) : null}

        {course.newSummaryCount > 0 ? (
          <span className={newSummaryBadge}>
            {compact ? (
              <>
                <span className="hidden sm:inline">{ns}</span>
                <span className="sm:hidden">{`${course.newSummaryCount} nouv.`}</span>
              </>
            ) : (
              ns
            )}
          </span>
        ) : null}

        {compact ? (
          <>
            <span className="sm:hidden">{`${q} · ${r}`}</span>
            <span className="hidden sm:inline">{`${q} · ${r} · ${m}`}</span>
          </>
        ) : (
          `${q} · ${r} · ${m}`
        )}
      </span>
    </Link>
  );
}
