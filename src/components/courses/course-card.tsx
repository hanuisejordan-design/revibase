import Link from "next/link";
import type { CourseSummary } from "@/features/courses/types";

const trainerBadge =
  "inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300";
const newQuestionBadge =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300";
const newSummaryBadge =
  "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";

/** Carte d'un cours, utilisée sur le tableau de bord et la page d'une classe. */
export function CourseCard({ course }: { course: CourseSummary }) {
  const bits = [
    `${course.questionCount} question${course.questionCount > 1 ? "s" : ""}`,
    `${course.summaryCount} résumé${course.summaryCount > 1 ? "s" : ""}`,
    `${course.memberCount} membre${course.memberCount > 1 ? "s" : ""}`,
  ];

  return (
    <Link
      href={`/course/${course.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="font-medium">{course.name}</span>
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500">
        {course.role === "trainer" ? <span className={trainerBadge}>Formateur</span> : null}
        {course.newQuestionCount > 0 ? (
          <span className={newQuestionBadge}>
            {course.newQuestionCount} nouvelle{course.newQuestionCount > 1 ? "s" : ""} question
            {course.newQuestionCount > 1 ? "s" : ""}
          </span>
        ) : null}
        {course.newSummaryCount > 0 ? (
          <span className={newSummaryBadge}>
            {course.newSummaryCount} nouveau{course.newSummaryCount > 1 ? "x" : ""} résumé
            {course.newSummaryCount > 1 ? "s" : ""}
          </span>
        ) : null}
        {bits.join(" · ")}
      </span>
    </Link>
  );
}
