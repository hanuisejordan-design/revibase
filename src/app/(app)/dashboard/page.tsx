import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getMyCourses } from "@/features/courses/queries";
import { getMyClasses } from "@/features/classes/queries";
import { ClassCard } from "@/components/classes/class-card";
import { CourseCard } from "@/components/courses/course-card";

export const metadata: Metadata = { title: "Tableau de bord" };

const primaryLink =
  "flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover";
const secondaryLink =
  "flex w-full items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-medium text-surface-foreground transition-colors hover:border-brand/40";
const sectionLabel = "text-[11px] font-semibold uppercase tracking-[0.14em] text-brand";

function plural(n: number, s: string, p = `${s}s`) {
  return `${n} ${n > 1 ? p : s}`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [classes, allCourses] = await Promise.all([getMyClasses(), getMyCourses()]);

  const nestedCourseIds = new Set(classes.flatMap((cl) => cl.courses.map((c) => c.id)));
  const standaloneCourses = allCourses.filter((c) => !nestedCourseIds.has(c.id));

  const isEmpty = classes.length === 0 && standaloneCourses.length === 0;

  const newQ =
    classes.reduce((n, c) => n + c.newQuestionCount, 0) +
    standaloneCourses.reduce((n, c) => n + c.newQuestionCount, 0);
  const newS =
    classes.reduce((n, c) => n + c.newSummaryCount, 0) +
    standaloneCourses.reduce((n, c) => n + c.newSummaryCount, 0);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(new Date())
    .toUpperCase();

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête vert pleine largeur */}
      <div className="-mx-4 -mt-6 bg-brand px-4 pt-7 pb-16 text-brand-foreground sm:-mx-6 sm:-mt-8 sm:px-6 sm:pt-9">
        <p className="text-[11px] font-medium tracking-[0.16em] uppercase text-brand-foreground/60">
          {dateLabel}
        </p>
        <h1 className="greeting mt-1 text-[2.75rem]">Bonjour {user.displayName}.</h1>
      </div>

      {/* Carte récap, posée sur le vert */}
      <div className="-mt-14">
        <div className="rounded-2xl border border-border bg-surface p-5 text-surface-foreground shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
          {isEmpty ? (
            <p className="text-sm text-muted">
              Bienvenue. Rejoins ta classe avec le code d&apos;invitation, ou crées-en une
              ci-dessous.
            </p>
          ) : newQ === 0 && newS === 0 ? (
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Check size={14} aria-hidden />
              </span>
              <p className="text-sm">Tu es à jour — rien de nouveau à lire.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <p className="display text-xl">
                {newQ > 0 ? plural(newQ, "nouvelle question", "nouvelles questions") : null}
                {newQ > 0 && newS > 0 ? <span className="text-muted"> · </span> : null}
                {newS > 0 ? plural(newS, "nouveau résumé", "nouveaux résumés") : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {newQ > 0 ? (
                  <Link
                    href="/nouvelles#questions"
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"
                  >
                    Voir les questions <ArrowRight size={15} aria-hidden />
                  </Link>
                ) : null}
                {newS > 0 ? (
                  <Link
                    href="/nouvelles#resumes"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-surface-foreground transition-colors hover:border-brand/40"
                  >
                    Voir les résumés <ArrowRight size={15} aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
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
          <ul className="grid gap-3 sm:grid-cols-2">
            {standaloneCourses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-2.5 border-t border-border pt-7">
        <Link href="/class/join" className={primaryLink}>
          Rejoindre une classe
        </Link>
        <Link href="/class/new" className={secondaryLink}>
          Créer une classe
        </Link>
        <Link href="/course/new" className={secondaryLink}>
          Créer un cours personnel
        </Link>
      </div>
    </div>
  );
}
