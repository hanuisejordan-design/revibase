import { notFound } from "next/navigation";
import { getClassContext } from "@/features/classes/queries";
import { listChapters } from "@/features/chapters/queries";
import { ChapterListEditor } from "@/components/chapters/chapter-list-editor";
import { AddChapterForm } from "@/components/chapters/add-chapter-form";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const chapters = await listChapters(classId);

  return (
    <div className="flex flex-col gap-6">
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
    </div>
  );
}
