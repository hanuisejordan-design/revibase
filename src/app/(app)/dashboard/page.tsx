import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getMyCourses } from "@/features/courses/queries";
import { getMyClasses } from "@/features/classes/queries";
import { ClassCard } from "@/components/classes/class-card";
import { CourseCard } from "@/components/courses/course-card";

export const metadata: Metadata = { title: "Tableau de bord" };

const primaryLink =
  "inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover";
const secondaryLink =
  "inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-surface-foreground transition-colors hover:border-brand/40";
const sectionLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-brand";

export default async function DashboardPage() {
  const user = await requireUser();
  const [classes, allCourses] = await Promise.all([getMyClasses(), getMyCourses()]);

  // Un cours rattaché à l'une de mes classes n'apparaît pas en « Autres cours ».
  const nestedCourseIds = new Set(classes.flatMap((cl) => cl.courses.map((c) => c.id)));
  const standaloneCourses = allCourses.filter((c) => !nestedCourseIds.has(c.id));

  const isEmpty = classes.length === 0 && standaloneCourses.length === 0;

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col gap-1.5">
        <h1 className="display text-3xl">Bonjour {user.displayName}.</h1>
        <p className="text-sm text-muted">
          {isEmpty
            ? "Rejoins ta classe avec le code d'invitation, ou crées-en une."
            : "Choisis une classe pour voir ses cours."}
        </p>
      </div>

      {classes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className={sectionLabel}>Mes classes</h2>
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
          <h2 className={sectionLabel}>Mes cours personnels</h2>
          <ul className="grid grid-cols-2 gap-3">
            {standaloneCourses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-7">
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
