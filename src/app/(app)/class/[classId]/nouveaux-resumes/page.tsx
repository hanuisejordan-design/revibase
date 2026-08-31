import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext, getClassNewSummaries } from "@/features/classes/queries";
import { MarkClassSummariesSeen } from "@/components/classes/mark-class-summaries-seen";
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

  return (
    <div className="flex flex-col gap-5">
      <MarkClassSummariesSeen classId={classId} />

      <div className="flex flex-col gap-1">
        <Link href={`/class/${classId}`} className="text-xs text-zinc-500 hover:underline">
          ← {ctx.name}
        </Link>
        <h2 className="text-lg font-semibold">
          Nouveaux résumés{summaries.length > 0 ? ` (${summaries.length})` : ""}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Depuis ta dernière visite, tous cours confondus, du plus ancien au plus récent.
        </p>
      </div>

      {summaries.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {summaries.map((s) => {
            const inner = (
              <>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {KIND_LABEL[s.kind]}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {s.courseName}
                </span>
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-zinc-500">
                  {s.chapterName ?? "Sans chapitre"} · par {s.authorName} ·{" "}
                  {relativeTime(s.createdAt)}
                </span>
              </>
            );
            return (
              <li
                key={s.id}
                className="rounded-lg border border-zinc-200 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-700"
              >
                {s.fileUrl ? (
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm"
                  >
                    {inner}
                  </a>
                ) : (
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm text-zinc-400">
                    {inner} · aperçu indisponible
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aucun nouveau résumé. Tu es à jour.
        </p>
      )}
    </div>
  );
}
