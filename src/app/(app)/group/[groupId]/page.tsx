import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroupContext, getGroupClasses, getGroupMembers } from "@/features/groups/queries";
import { InviteCode } from "@/components/courses/invite-code";
import { CourseCard } from "@/components/courses/course-card";
import { LeaveGroupButton } from "@/components/groups/leave-group-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const ctx = await getGroupContext(groupId);
  return { title: ctx?.name ?? "Groupe" };
}

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const ctx = await getGroupContext(groupId);
  if (!ctx) notFound();

  const [classes, members] = await Promise.all([
    getGroupClasses(groupId),
    getGroupMembers(groupId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Tableau de bord
        </Link>
        <h1 className="text-xl font-semibold">{ctx.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Groupe · {classes.length} classe{classes.length > 1 ? "s" : ""} · {members.length}{" "}
          membre{members.length > 1 ? "s" : ""}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Classes</h2>
          {ctx.isAdmin ? (
            <Link
              href={`/group/${groupId}/course/new`}
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              + Créer une classe
            </Link>
          ) : null}
        </div>

        {classes.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <li key={c.id}>
                <CourseCard cls={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            {ctx.isAdmin
              ? "Aucune classe pour l'instant. Crée la première."
              : "Aucune classe pour l'instant."}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <InviteCode
          code={ctx.joinCode}
          hint="Partage ce code : ceux qui rejoignent le groupe ont accès à toutes ses classes."
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
          <LeaveGroupButton groupId={ctx.id} />
        </section>
      ) : null}
    </div>
  );
}
