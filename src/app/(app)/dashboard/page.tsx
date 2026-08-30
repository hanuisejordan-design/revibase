import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getMyCourses } from "@/features/courses/queries";
import { getMyClasses } from "@/features/classes/queries";
import { ClassCard } from "@/components/classes/class-card";
import { CourseCard } from "@/components/courses/course-card";

export const metadata: Metadata = { title: "Tableau de bord" };

const primaryLink =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryLink =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

export default async function DashboardPage() {
  const user = await requireUser();
  const [classes, allCourses] = await Promise.all([getMyClasses(), getMyCourses()]);

  // Un cours rattaché à l'une de mes classes n'apparaît pas en « Autres cours ».
  const nestedCourseIds = new Set(classes.flatMap((cl) => cl.courses.map((c) => c.id)));
  const standaloneCourses = allCourses.filter((c) => !nestedCourseIds.has(c.id));

  const isEmpty = classes.length === 0 && standaloneCourses.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Bonjour {user.displayName}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isEmpty
            ? "Rejoins ta classe avec le code d'invitation, ou crées-en une."
            : "Choisis une classe pour voir ses cours."}
        </p>
      </div>

      {classes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Mes classes
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {classes.map((cl) => (
              <li key={cl.id}>
                <ClassCard cls={cl} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {standaloneCourses.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Mes cours personnels
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {standaloneCourses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex flex-wrap gap-3">
          <Link href="/class/join" className={primaryLink}>
            Rejoindre une classe
          </Link>
          <Link href="/class/new" className={secondaryLink}>
            Créer une classe
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/course/new" className={secondaryLink}>
            Créer un cours personnel
          </Link>
        </div>
      </div>
    </div>
  );
}
