import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext, getCourseMembers } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { ChapterListEditor } from "@/components/chapters/chapter-list-editor";
import { AddChapterForm } from "@/components/chapters/add-chapter-form";
import { InviteCode } from "@/components/courses/invite-code";
import { CourseMemberManager } from "@/components/courses/course-member-manager";
import { LeaveCourseButton } from "@/components/courses/leave-course-button";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const [chapters, members] = await Promise.all([
    listChapters(courseId),
    getCourseMembers(courseId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
        <InviteCode code={ctx.joinCode} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">Chapitres</h2>
        <p className="text-muted text-sm">
          Les chapitres rangent les questions par thème. Chaque membre du cours peut les modifier.
          Supprimer un chapitre ne supprime pas ses questions : elles se retrouvent « sans chapitre
          ».
        </p>
        <ChapterListEditor courseId={courseId} chapters={chapters} />
        <div className="pt-2">
          <AddChapterForm courseId={courseId} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
          Participants ({members.length})
        </h2>
        {ctx.isAdmin ? (
          <p className="text-muted text-sm">
            <strong>Admin</strong> : gère le cours (code, membres, rôles).{" "}
            <strong>Formateur</strong> : peut valider une réponse. Un cours sans formateur n&apos;a
            simplement pas de réponses « validées ».
          </p>
        ) : null}
        <CourseMemberManager courseId={courseId} members={members} canManage={ctx.isAdmin} />
      </section>

      {ctx.classId ? (
        <section className="border-border text-muted border-t pt-4 text-sm">
          Cours rattaché à la classe{" "}
          <Link href={`/class/${ctx.classId}`} className="underline">
            {ctx.classLabel}
          </Link>
          .{" "}
          {!ctx.isExplicitMember
            ? "Tu y as accès via la classe — pour partir, quitte la classe."
            : null}
        </section>
      ) : null}

      {ctx.isExplicitMember && !ctx.isCreator ? (
        <section className="border-border border-t pt-4">
          <LeaveCourseButton courseId={ctx.id} />
        </section>
      ) : null}
    </div>
  );
}
