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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Cours ({courses.length})
        </h2>
        {ctx.isAdmin ? (
          <Link
            href={`/class/${classId}/course/new`}
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            + Créer un cours
          </Link>
        ) : null}
      </div>

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
  );
}
