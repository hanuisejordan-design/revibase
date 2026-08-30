import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext, getClassCourses, getClassMembers } from "@/features/classes/queries";
import { InviteCode } from "@/components/courses/invite-code";
import { CourseCard } from "@/components/courses/course-card";
import { LeaveClassButton } from "@/components/classes/leave-class-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string }>;
}): Promise<Metadata> {
  const { classId } = await params;
  const ctx = await getClassContext(classId);
  return { title: ctx?.name ?? "Classe" };
}

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const [courses, members] = await Promise.all([
    getClassCourses(classId),
    getClassMembers(classId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Tableau de bord
        </Link>
        <h1 className="text-xl font-semibold">{ctx.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Classe · {courses.length} cours · {members.length} membre
          {members.length > 1 ? "s" : ""}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Cours</h2>
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

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <InviteCode
          code={ctx.joinCode}
          hint="Partage ce code : ceux qui rejoignent la classe ont accès à tous ses cours."
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Membres ({members.length})
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2">
              <span>{m.displayName}</span>
              {m.isAdmin ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Admin
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {!ctx.isAdmin ? (
        <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <LeaveClassButton classId={ctx.id} />
        </section>
      ) : null}
    </div>
  );
}
