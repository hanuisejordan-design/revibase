import type { SummaryItem } from "@/features/summaries/types";
import { relativeTime } from "@/lib/utils/date";
import { DeleteSummaryButton } from "./delete-summary-button";

const KIND_LABEL: Record<SummaryItem["kind"], string> = {
  pdf: "PDF",
  image: "IMG",
  other: "FICHIER",
};

const NO_CHAPTER = "__none__";

const badgeCls =
  "rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
const meta = "text-xs text-zinc-500";

function Row({ summary, courseId }: { summary: SummaryItem; courseId: string }) {
  const inner = (
    <>
      <span className={badgeCls}>{KIND_LABEL[summary.kind]}</span>
      <span className="font-medium">{summary.title}</span>
      <span className={meta}>
        par {summary.authorName} · {relativeTime(summary.createdAt)}
      </span>
    </>
  );

  return (
    <li className="flex items-stretch gap-1 rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
      {summary.fileUrl ? (
        <a
          href={summary.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm"
        >
          {inner}
        </a>
      ) : (
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm text-zinc-400">
          {inner} · aperçu indisponible
        </span>
      )}
      {summary.canDelete ? (
        <span className="flex items-center pr-3 text-xs">
          <DeleteSummaryButton courseId={courseId} summaryId={summary.id} />
        </span>
      ) : null}
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
        Aucun résumé pour l&apos;instant. Ajoute le premier avec le bouton ci-dessus.
      </p>
    );
  }

  // Regroupement par chapitre, dans l'ordre d'apparition.
  const groups = new Map<string, { label: string; items: SummaryItem[] }>();
  for (const s of summaries) {
    const key = s.chapterId ?? NO_CHAPTER;
    if (!groups.has(key)) groups.set(key, { label: s.chapterName ?? "Sans chapitre", items: [] });
    groups.get(key)!.items.push(s);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...groups.values()].map((g) => (
        <section key={g.label} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{g.label}</h3>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((s) => (
              <Row key={s.id} summary={s} courseId={courseId} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
