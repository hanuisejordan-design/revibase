import type { SummaryItem } from "@/features/summaries/types";
import { relativeTime } from "@/lib/utils/date";
import { DeleteSummaryButton } from "./delete-summary-button";

function SummaryRow({ summary, courseId }: { summary: SummaryItem; courseId: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium">{summary.title}</span>
        <span className="text-xs text-zinc-500">
          par {summary.authorName} · {relativeTime(summary.createdAt)}
        </span>
      </div>

      {summary.fileUrl ? (
        summary.kind === "image" ? (
          <a href={summary.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={summary.fileUrl}
              alt={summary.title}
              className="max-h-72 rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
            />
          </a>
        ) : summary.kind === "pdf" ? (
          <iframe
            src={summary.fileUrl}
            title={summary.title}
            className="h-96 w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
        ) : null
      ) : (
        <p className="text-xs text-zinc-500">Aperçu indisponible.</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        {summary.fileUrl ? (
          <a
            href={summary.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300"
          >
            Ouvrir « {summary.fileName} »
          </a>
        ) : null}
        {summary.canDelete ? (
          <DeleteSummaryButton courseId={courseId} summaryId={summary.id} />
        ) : null}
      </div>
    </li>
  );
}

export function SummaryList({
  summaries,
  courseId,
}: {
  summaries: SummaryItem[];
  courseId: string;
}) {
  if (summaries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun résumé pour l&apos;instant. Ajoute le premier ci-dessous.
      </p>
    );
  }

  // Regroupement par chapitre, chapitres d'abord dans l'ordre d'apparition.
  const groups = new Map<string, { label: string; items: SummaryItem[] }>();
  for (const s of summaries) {
    const key = s.chapterId ?? "__none__";
    const label = s.chapterName ?? "Sans chapitre";
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(s);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.values()].map((g) => (
        <section key={g.label} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{g.label}</h3>
          <ul className="flex flex-col gap-3">
            {g.items.map((s) => (
              <SummaryRow key={s.id} summary={s} courseId={courseId} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
