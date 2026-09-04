import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext, getClassNewSummaries } from "@/features/classes/queries";
import { markAllClassSummariesReadAction } from "@/features/reads/actions";
import { SummaryReadLink } from "@/components/summaries/summary-read-link";
import { relativeTime } from "@/lib/utils/date";

const KIND_LABEL = { pdf: "PDF", image: "IMG", other: "FICHIER" } as const;

export default async function ClassNewSummariesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const summaries = await getClassNewSummaries(classId);
  const markAll = markAllClassSummariesReadAction.bind(null, classId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link href={`/class/${classId}`} className="text-muted text-xs hover:underline">
          ← {ctx.name}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Nouveaux résumés{summaries.length > 0 ? ` (${summaries.length})` : ""}
          </h2>
          {summaries.length > 0 ? (
            <form action={markAll}>
              <button type="submit" className="text-muted text-sm hover:underline">
                Tout marquer comme lu
              </button>
            </form>
          ) : null}
        </div>
        <p className="text-muted text-sm">
          Ce que tu n&apos;as pas encore ouvert, tous cours confondus. Un résumé disparaît
          d&apos;ici une fois que tu l&apos;as ouvert.
        </p>
      </div>

      {summaries.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {summaries.map((s) => {
            const inner = (
              <>
                <span className="bg-background text-muted rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                  {KIND_LABEL[s.kind]}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {s.courseName}
                </span>
                <span className="font-medium">{s.title}</span>
                <span className="text-muted text-xs">
                  {s.chapterName ?? "Sans chapitre"} · par {s.authorName} ·{" "}
                  {relativeTime(s.createdAt)}
                </span>
              </>
            );
            return (
              <li
                key={s.id}
                className="border-border rounded-lg border transition-colors hover:border-emerald-400 dark:hover:border-emerald-700"
              >
                {s.fileUrl ? (
                  <SummaryReadLink
                    summaryId={s.id}
                    href={s.fileUrl}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm"
                  >
                    {inner}
                  </SummaryReadLink>
                ) : (
                  <span className="text-muted flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm">
                    {inner} · aperçu indisponible
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-border text-muted rounded-xl border border-dashed p-6 text-center text-sm">
          Aucun nouveau résumé. Tu es à jour.
        </p>
      )}
    </div>
  );
}
