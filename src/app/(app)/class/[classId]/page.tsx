import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassContext, getClassCourses } from "@/features/classes/queries";
import { CourseCard } from "@/components/courses/course-card";

export default async function ClassCoursesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const courses = await getClassCourses(classId);
  const newCount = courses.reduce((n, c) => n + c.newQuestionCount, 0);
  const newSummaryCount = courses.reduce((n, c) => n + c.newSummaryCount, 0);

  return (
    <div className="flex flex-col gap-6">
      {newCount > 0 ? (
        <Link
          href={`/class/${classId}/nouvelles`}
          className="flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm transition-colors hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:border-amber-800"
        >
          <span className="font-medium text-amber-900 dark:text-amber-200">
            {newCount} nouvelle{newCount > 1 ? "s" : ""} question{newCount > 1 ? "s" : ""} depuis ta
            dernière visite
          </span>
          <span className="shrink-0 text-amber-800 dark:text-amber-300">Les parcourir →</span>
        </Link>
      ) : null}

      {newSummaryCount > 0 ? (
        <Link
          href={`/class/${classId}/nouveaux-resumes`}
          className="flex items-center justify-between gap-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm transition-colors hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:border-emerald-800"
        >
          <span className="font-medium text-emerald-900 dark:text-emerald-200">
            {newSummaryCount} nouveau{newSummaryCount > 1 ? "x" : ""} résumé
            {newSummaryCount > 1 ? "s" : ""} depuis ta dernière visite
          </span>
          <span className="shrink-0 text-emerald-800 dark:text-emerald-300">Les parcourir →</span>
        </Link>
      ) : null}

      {ctx.isAdmin ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/class/${classId}/course/new`}
            className="bg-brand text-brand-foreground hover:bg-brand-hover inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Créer un cours
          </Link>
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
          Cours ({courses.length})
        </h2>

        {courses.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3">
            {courses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} compact />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-sm">
            {ctx.isAdmin
              ? "Aucun cours pour l'instant. Crée le premier."
              : "Aucun cours pour l'instant."}
          </p>
        )}
      </section>
    </div>
  );
}
