import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getMyCourses } from "@/features/courses/queries";
import { getMyGroups } from "@/features/groups/queries";
import { CourseCard } from "@/components/courses/course-card";

export const metadata: Metadata = { title: "Tableau de bord" };

const primaryLink =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryLink =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

export default async function DashboardPage() {
  const user = await requireUser();
  const [groups, allClasses] = await Promise.all([getMyGroups(), getMyCourses()]);

  // Les classes affichées sous un groupe ne sont pas répétées dans « Autres ».
  const groupedClassIds = new Set(groups.flatMap((g) => g.classes.map((c) => c.id)));
  const standaloneClasses = allClasses.filter((c) => !groupedClassIds.has(c.id));

  const isEmpty = groups.length === 0 && standaloneClasses.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Bonjour {user.displayName}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isEmpty
            ? "Crée une classe ou un groupe, ou rejoins-en un avec un code d'invitation."
            : "Choisis une classe pour continuer."}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/group/${g.id}`}
              className="text-xs font-semibold tracking-wide text-zinc-500 uppercase hover:underline"
            >
              {g.name}
            </Link>
            {g.isAdmin ? (
              <Link
                href={`/group/${g.id}/course/new`}
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                + Classe
              </Link>
            ) : null}
          </div>
          {g.classes.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.classes.map((c) => (
                <li key={c.id}>
                  <CourseCard cls={c} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              Aucune classe dans ce groupe pour l&apos;instant.
            </p>
          )}
        </section>
      ))}

      {standaloneClasses.length > 0 ? (
        <section className="flex flex-col gap-3">
          {groups.length > 0 ? (
            <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Autres classes
            </h2>
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2">
            {standaloneClasses.map((c) => (
              <li key={c.id}>
                <CourseCard cls={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex flex-wrap gap-3">
          <Link href="/course/new" className={primaryLink}>
            Créer une classe
          </Link>
          <Link href="/course/join" className={secondaryLink}>
            Rejoindre une classe
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/group/new" className={secondaryLink}>
            Créer un groupe
          </Link>
          <Link href="/group/join" className={secondaryLink}>
            Rejoindre un groupe
          </Link>
        </div>
      </div>
    </div>
  );
}
