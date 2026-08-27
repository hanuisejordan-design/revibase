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
  const isTrainer = ctx.role === "trainer";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Chapitres</h2>

        {isTrainer ? (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Les chapitres rangent les questions par thème. Supprimer un chapitre ne supprime pas
              ses questions : elles se retrouvent « sans chapitre ».
            </p>
            <ChapterListEditor classId={classId} chapters={chapters} />
            <div className="pt-2">
              <AddChapterForm classId={classId} />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-500">Seul le formateur peut gérer les chapitres.</p>
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
          </>
        )}
      </section>
    </div>
  );
}
