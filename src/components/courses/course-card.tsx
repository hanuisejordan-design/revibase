import Link from "next/link";
import type { CourseSummary } from "@/features/courses/types";
import { cn } from "@/lib/utils/cn";

const badge = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

/** Carte d'un cours, utilisée sur le tableau de bord et la page d'une classe. */
export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/course/${course.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="font-medium">{course.name}</span>
      <span className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {course.isAdmin ? (
          <span className={cn(badge, "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}>
            Admin
          </span>
        ) : null}
        {course.role === "trainer" ? (
          <span className={cn(badge, "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300")}>
            Formateur
          </span>
        ) : null}
        {course.memberCount} membre{course.memberCount > 1 ? "s" : ""}
      </span>
    </Link>
  );
}
