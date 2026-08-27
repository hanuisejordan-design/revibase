import { notFound } from "next/navigation";
import { getClassContext, getClassMembers } from "@/features/classes/queries";
import { listChapters } from "@/features/chapters/queries";
import { RoleBadge } from "@/components/classes/role-badge";
import { InviteCode } from "@/components/classes/invite-code";
import { LeaveClassButton } from "@/components/classes/leave-class-button";

export default async function ClassHomePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const [members, chapters] = await Promise.all([getClassMembers(classId), listChapters(classId)]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <RoleBadge role={ctx.role} />
          <span>
            {members.length} membre{members.length > 1 ? "s" : ""}
          </span>
        </div>
        <InviteCode code={ctx.joinCode} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Chapitres</h2>
        {chapters.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {chapters.map((ch) => (
              <li
                key={ch.id}
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-800"
              >
                {ch.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Aucun chapitre.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Participants
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2">
              <span>{m.displayName}</span>
              <RoleBadge role={m.role} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        Les questions et les quiz de cette classe arrivent aux prochaines étapes.
      </section>

      {!ctx.isCreator ? (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <LeaveClassButton classId={ctx.id} />
        </div>
      ) : null}
    </div>
  );
}
