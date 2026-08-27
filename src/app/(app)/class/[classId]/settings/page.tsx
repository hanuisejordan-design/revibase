import { notFound } from "next/navigation";
import { getClassContext, getClassMembers } from "@/features/classes/queries";
import { listChapters } from "@/features/chapters/queries";
import { ChapterListEditor } from "@/components/chapters/chapter-list-editor";
import { AddChapterForm } from "@/components/chapters/add-chapter-form";
import { InviteCode } from "@/components/classes/invite-code";
import { RoleBadge } from "@/components/classes/role-badge";
import { LeaveClassButton } from "@/components/classes/leave-class-button";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const [chapters, members] = await Promise.all([listChapters(classId), getClassMembers(classId)]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <InviteCode code={ctx.joinCode} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Chapitres</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Les chapitres rangent les questions par thème. Chaque membre de la classe peut les
          modifier. Supprimer un chapitre ne supprime pas ses questions : elles se retrouvent « sans
          chapitre ».
        </p>
        <ChapterListEditor classId={classId} chapters={chapters} />
        <div className="pt-2">
          <AddChapterForm classId={classId} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Participants ({members.length})
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

      {!ctx.isCreator ? (
        <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <LeaveClassButton classId={ctx.id} />
        </section>
      ) : null}
    </div>
  );
}
