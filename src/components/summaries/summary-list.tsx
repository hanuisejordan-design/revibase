import type { SummaryItem } from "@/features/summaries/types";
import { relativeTime } from "@/lib/utils/date";
import { DeleteSummaryButton } from "./delete-summary-button";
import { SummaryPinButton } from "./summary-pin-button";
import { SummaryReadLink } from "./summary-read-link";

const KIND_LABEL: Record<SummaryItem["kind"], string> = {
  pdf: "PDF",
  image: "IMG",
  other: "FICHIER",
};

const NO_CHAPTER = "__none__";

const badgeCls =
  "rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted";
const meta = "text-xs text-muted";

export function SummaryRow({ summary, courseId }: { summary: SummaryItem; courseId: string }) {
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
    <li className="border-border hover:border-brand/40 flex items-stretch gap-1 rounded-lg border transition-colors">
      <span className="flex items-center pl-2">
        <SummaryPinButton courseId={courseId} summaryId={summary.id} pinned={summary.pinned} />
      </span>
      {summary.fileUrl ? (
        <SummaryReadLink
          summaryId={summary.id}
          href={summary.fileUrl}
          className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 py-2 pr-3 pl-1 text-sm"
        >
          {inner}
        </SummaryReadLink>
      ) : (
        <span className="text-muted flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 py-2 pr-3 pl-1 text-sm">
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
      <p className="text-muted text-sm">
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
          <h3 className="text-muted text-xs font-semibold tracking-wide uppercase">{g.label}</h3>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((s) => (
              <SummaryRow key={s.id} summary={s} courseId={courseId} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
