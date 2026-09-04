import type { Metadata } from "next";
import Link from "next/link";
import { getMyNewQuestions, getMyNewSummaries } from "@/features/classes/queries";
import {
  markAllMyQuestionsReadAction,
  markAllMySummariesReadAction,
} from "@/features/reads/actions";
import { PurposeBadge } from "@/components/questions/purpose-badge";
import { SummaryReadLink } from "@/components/summaries/summary-read-link";
import { relativeTime } from "@/lib/utils/date";
import { QUESTION_KIND_LABELS } from "@/constants/app";

export const metadata: Metadata = { title: "Mes nouveautés" };

const KIND_LABEL = { pdf: "PDF", image: "IMG", other: "FICHIER" } as const;
const chip = "rounded-full border border-border px-2 py-0.5";
const coursePill = "rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand";

export default async function MyNewPage() {
  const [questions, summaries] = await Promise.all([getMyNewQuestions(), getMyNewSummaries()]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/dashboard" className="text-xs text-muted hover:underline">
          ← Tableau de bord
        </Link>
        <h1 className="display text-2xl">Mes nouveautés</h1>
        <p className="text-sm text-muted">
          Tout ce que tu n&apos;as pas encore ouvert, tous cours confondus. Un élément disparaît
          d&apos;ici une fois que tu l&apos;as ouvert.
        </p>
      </div>

      {/* Questions */}
      <section id="questions" className="flex flex-col gap-3 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
            Questions{questions.length > 0 ? ` (${questions.length})` : ""}
          </h2>
          {questions.length > 0 ? (
            <form action={markAllMyQuestionsReadAction}>
              <button type="submit" className="text-sm text-muted hover:underline">
                Tout marquer comme lu
              </button>
            </form>
          ) : null}
        </div>

        {questions.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/course/${q.courseId}/questions/${q.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-surface-foreground transition-colors hover:border-brand/40"
                >
                  <h3 className="font-medium">{q.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className={coursePill}>{q.courseName}</span>
                    <span className={chip}>{q.chapterName ?? "Sans chapitre"}</span>
                    <PurposeBadge purpose={q.purpose} />
                    {q.kind === "open" ? (
                      <span>
                        {q.answerCount} réponse{q.answerCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span>{QUESTION_KIND_LABELS[q.kind]}</span>
                    )}
                    <span className="ml-auto">
                      {q.authorName} · {relativeTime(q.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
            Aucune nouvelle question.
          </p>
        )}
      </section>

      {/* Résumés */}
      <section id="resumes" className="flex flex-col gap-3 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
            Résumés{summaries.length > 0 ? ` (${summaries.length})` : ""}
          </h2>
          {summaries.length > 0 ? (
            <form action={markAllMySummariesReadAction}>
              <button type="submit" className="text-sm text-muted hover:underline">
                Tout marquer comme lu
              </button>
            </form>
          ) : null}
        </div>

        {summaries.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {summaries.map((s) => {
              const inner = (
                <>
                  <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted dark:bg-white/10">
                    {KIND_LABEL[s.kind]}
                  </span>
                  <span className={coursePill}>{s.courseName}</span>
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-muted">
                    {s.chapterName ?? "Sans chapitre"} · par {s.authorName} ·{" "}
                    {relativeTime(s.createdAt)}
                  </span>
                </>
              );
              return (
                <li
                  key={s.id}
                  className="rounded-xl border border-border bg-surface transition-colors hover:border-brand/40"
                >
                  {s.fileUrl ? (
                    <SummaryReadLink
                      summaryId={s.id}
                      href={s.fileUrl}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm text-surface-foreground"
                    >
                      {inner}
                    </SummaryReadLink>
                  ) : (
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm text-muted">
                      {inner} · aperçu indisponible
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
            Aucun nouveau résumé.
          </p>
        )}
      </section>
    </div>
  );
}
