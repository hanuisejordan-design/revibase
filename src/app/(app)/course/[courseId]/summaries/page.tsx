import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listSummaries } from "@/features/summaries/queries";
import { SummaryList } from "@/components/summaries/summary-list";
import { FavoritesFilter } from "@/components/summaries/favorites-filter";
import { MarkSummariesSeen } from "@/components/summaries/mark-summaries-seen";

export const metadata: Metadata = { title: "Résumés" };

export default async function SummariesPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ favoris?: string }>;
}) {
  const { courseId } = await params;
  const onlyFav = (await searchParams).favoris === "1";

  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const summaries = await listSummaries(courseId);
  const visible = onlyFav ? summaries.filter((s) => s.pinned) : summaries;

  return (
    <div className="flex flex-col gap-6">
      <MarkSummariesSeen courseId={courseId} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Résumés</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Les fiches et résumés du cours, partagés par les membres.
          </p>
        </div>
        <Link
          href={`/course/${courseId}/summaries/new`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Ajouter un résumé
        </Link>
      </div>

      {summaries.length > 0 ? <FavoritesFilter active={onlyFav} /> : null}

      {onlyFav && visible.length === 0 && summaries.length > 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun favori. Clique l&apos;étoile d&apos;un résumé pour l&apos;ajouter.
        </p>
      ) : (
        <SummaryList summaries={visible} courseId={courseId} />
      )}
    </div>
  );
}
