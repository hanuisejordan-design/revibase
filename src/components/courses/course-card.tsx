import Link from "next/link";
import type { CourseSummary } from "@/features/courses/types";

const trainerBadge =
  "hidden items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand sm:inline-flex";
const newQuestionBadge =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300";
const newSummaryBadge =
  "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";

/**
 * Carte d'un cours (tableau de bord + page d'une classe). Grille à 2 colonnes
 * dès le mobile. En dessous de `sm` : on montre les compteurs
 * questions / résumés (plus utiles que le badge « Formateur », qui reste en
 * desktop) ; les compteurs membres restent desktop seulement.
 */
export function CourseCard({ course }: { course: CourseSummary }) {
  const q = `${course.questionCount} question${course.questionCount > 1 ? "s" : ""}`;
  const r = `${course.summaryCount} résumé${course.summaryCount > 1 ? "s" : ""}`;
  const m = `${course.memberCount} membre${course.memberCount > 1 ? "s" : ""}`;

  return (
    <Link
      href={`/course/${course.id}`}
      className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-surface-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-brand/40"
    >
      <span className="font-medium">{course.name}</span>
      <span className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
        {course.role === "trainer" ? <span className={trainerBadge}>Formateur</span> : null}
        {course.newQuestionCount > 0 ? (
          <span className={newQuestionBadge}>
            <span className="hidden sm:inline">
              {`${course.newQuestionCount} nouvelle${
                course.newQuestionCount > 1 ? "s" : ""
              } question${course.newQuestionCount > 1 ? "s" : ""}`}
            </span>
            <span className="sm:hidden">{`${course.newQuestionCount} nouv.`}</span>
          </span>
        ) : null}
        {course.newSummaryCount > 0 ? (
          <span className={newSummaryBadge}>
            <span className="hidden sm:inline">
              {`${course.newSummaryCount} nouveau${
                course.newSummaryCount > 1 ? "x" : ""
              } résumé${course.newSummaryCount > 1 ? "s" : ""}`}
            </span>
            <span className="sm:hidden">{`${course.newSummaryCount} nouv.`}</span>
          </span>
        ) : null}
        <span className="sm:hidden">
          {q} · {r}
        </span>
        <span className="hidden sm:inline">
          {q} · {r} · {m}
        </span>
      </span>
    </Link>
  );
}
