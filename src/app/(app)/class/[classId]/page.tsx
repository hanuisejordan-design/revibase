import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassContext, getClassCourses } from "@/features/classes/queries";
import { CourseCard } from "@/components/courses/course-card";
import { InviteCode } from "@/components/courses/invite-code";

export default async function ClassCoursesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const courses = await getClassCourses(classId);

  return (
    <div className="flex flex-col gap-6">
      {ctx.isAdmin ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/class/${classId}/course/new`}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Créer un cours
          </Link>
        </div>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <InviteCode
          code={ctx.joinCode}
          hint="Partage ce code pour faire entrer quelqu'un : il aura accès à tous les cours de la classe."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Cours ({courses.length})
        </h2>

        {courses.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            {ctx.isAdmin
              ? "Aucun cours pour l'instant. Crée le premier."
              : "Aucun cours pour l'instant."}
          </p>
        )}
      </section>
    </div>
  );
}
