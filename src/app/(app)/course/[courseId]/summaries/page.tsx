import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { listSummaries } from "@/features/summaries/queries";
import { SummaryList } from "@/components/summaries/summary-list";
import { SummaryUploadForm } from "@/components/summaries/summary-upload-form";

export const metadata: Metadata = { title: "Résumés" };

export default async function SummariesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const [summaries, chapters] = await Promise.all([
    listSummaries(courseId),
    listChapters(courseId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Résumés</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Les fiches et résumés du cours, partagés par les membres. PDF ou photo de notes.
        </p>
      </div>

      <SummaryList summaries={summaries} courseId={courseId} />

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Ajouter un résumé
        </h3>
        <SummaryUploadForm courseId={courseId} chapters={chapters} />
      </section>
    </div>
  );
}
