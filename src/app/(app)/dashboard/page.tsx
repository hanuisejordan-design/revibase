import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getMyCourses } from "@/features/courses/queries";
import { getMyClasses } from "@/features/classes/queries";
import { CourseCard } from "@/components/courses/course-card";

export const metadata: Metadata = { title: "Tableau de bord" };

const primaryLink =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryLink =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

export default async function DashboardPage() {
  const user = await requireUser();
  const [classes, allCourses] = await Promise.all([getMyClasses(), getMyCourses()]);

  // Les cours affichés sous leur classe ne sont pas répétés dans « Autres cours ».
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
            : "Choisis un cours pour continuer."}
        </p>
      </div>

      {classes.map((cl) => (
        <section key={cl.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/class/${cl.id}`}
              className="text-xs font-semibold tracking-wide text-zinc-500 uppercase hover:underline"
            >
              {cl.name}
            </Link>
            {cl.isAdmin ? (
              <Link
                href={`/class/${cl.id}/course/new`}
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                + Cours
              </Link>
            ) : null}
          </div>
          {cl.courses.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {cl.courses.map((c) => (
                <li key={c.id}>
                  <CourseCard course={c} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              Aucun cours dans cette classe pour l&apos;instant.
            </p>
          )}
        </section>
      ))}

      {standaloneCourses.length > 0 ? (
        <section className="flex flex-col gap-3">
          {classes.length > 0 ? (
            <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Autres cours
            </h2>
          ) : null}
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
        <p className="text-xs text-zinc-500">
          Juste besoin d&apos;un espace de révision seul, sans classe ?{" "}
          <Link href="/course/join" className="underline">
            Rejoindre un cours
          </Link>{" "}
          ·{" "}
          <Link href="/course/new" className="underline">
            en créer un
          </Link>
        </p>
      </div>
    </div>
  );
}
