import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { SummaryUploadForm } from "@/components/summaries/summary-upload-form";

export const metadata: Metadata = { title: "Ajouter un résumé" };

export default async function NewSummaryPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const chapters = await listChapters(courseId);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/course/${courseId}/summaries`}
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Résumés
        </Link>
        <h1 className="text-xl font-semibold">Ajouter un résumé</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Un fichier (PDF ou photo de notes) + un titre. Visible par tous les membres du cours.
        </p>
      </div>
      <SummaryUploadForm courseId={courseId} chapters={chapters} />
    </div>
  );
}
