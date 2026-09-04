import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listSummaries } from "@/features/summaries/queries";
import { SummaryList } from "@/components/summaries/summary-list";
import { FavoritesFilter } from "@/components/summaries/favorites-filter";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">Résumés</h2>
          <p className="text-muted text-sm">
            Les fiches et résumés du cours, partagés par les membres.
          </p>
        </div>
        <Link
          href={`/course/${courseId}/summaries/new`}
          className="bg-brand text-brand-foreground hover:bg-brand-hover inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
        >
          Ajouter un résumé
        </Link>
      </div>

      {summaries.length > 0 ? <FavoritesFilter active={onlyFav} /> : null}

      {onlyFav && visible.length === 0 && summaries.length > 0 ? (
        <p className="text-muted text-sm">
          Aucun favori. Clique l&apos;étoile d&apos;un résumé pour l&apos;ajouter.
        </p>
      ) : (
        <SummaryList summaries={visible} courseId={courseId} />
      )}
    </div>
  );
}
