import type { Metadata } from "next";
import Link from "next/link";
import type { ClassNewQuestion, ClassNewSummary } from "@/features/classes/types";
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

type WithCourse = { courseId: string; courseName: string; className: string | null };

/** Regroupe des éléments par classe parente puis par cours, ordre stable. */
function groupByClassCourse<T extends WithCourse>(items: T[]) {
  const classes = new Map<
    string,
    {
      className: string | null;
      courses: Map<string, { courseId: string; courseName: string; items: T[] }>;
    }
  >();

  for (const it of items) {
    const ck = it.className ?? " perso";
    let cl = classes.get(ck);
    if (!cl) {
      cl = { className: it.className, courses: new Map() };
      classes.set(ck, cl);
    }
    let co = cl.courses.get(it.courseId);
    if (!co) {
      co = { courseId: it.courseId, courseName: it.courseName, items: [] };
      cl.courses.set(it.courseId, co);
    }
    co.items.push(it);
  }

  return [...classes.values()]
    .sort((a, b) =>
      a.className === null
        ? 1
        : b.className === null
          ? -1
          : a.className.localeCompare(b.className, "fr"),
    )
    .map((cl) => ({
      className: cl.className,
      courses: [...cl.courses.values()].sort((a, b) =>
        a.courseName.localeCompare(b.courseName, "fr"),
      ),
    }));
}

const classHeading = "text-sm font-medium text-foreground";
const courseHeading = "text-[11px] font-semibold tracking-[0.1em] text-muted uppercase";

function QuestionRow({ q }: { q: ClassNewQuestion }) {
  return (
    <Link
      href={`/course/${q.courseId}/questions/${q.id}`}
      className="border-border bg-surface text-surface-foreground hover:border-brand/40 flex flex-col gap-2 rounded-2xl border p-4 transition-colors"
    >
      <h3 className="font-medium">{q.title}</h3>
      <div className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
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
  );
}

function SummaryRow({ s }: { s: ClassNewSummary }) {
  const inner = (
    <>
      <span className="text-muted rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide dark:bg-white/10">
        {KIND_LABEL[s.kind]}
      </span>
      <span className="font-medium">{s.title}</span>
      <span className="text-muted text-xs">
        {s.chapterName ?? "Sans chapitre"} · par {s.authorName} · {relativeTime(s.createdAt)}
      </span>
    </>
  );
  return (
    <li className="border-border bg-surface hover:border-brand/40 rounded-xl border transition-colors">
      {s.fileUrl ? (
        <SummaryReadLink
          summaryId={s.id}
          href={s.fileUrl}
          className="text-surface-foreground flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm"
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
}

export default async function MyNewPage() {
  const [questions, summaries] = await Promise.all([getMyNewQuestions(), getMyNewSummaries()]);

  const qGroups = groupByClassCourse(questions);
  const sGroups = groupByClassCourse(summaries);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/dashboard" className="text-muted text-xs hover:underline">
          ← Tableau de bord
        </Link>
        <h1 className="display text-2xl">Mes nouveautés</h1>
        <p className="text-muted text-sm">
          Tout ce que tu n&apos;as pas encore ouvert, rangé par cours. Un élément disparaît
          d&apos;ici une fois que tu l&apos;as ouvert.
        </p>
      </div>

      {/* Questions */}
      <section id="questions" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-brand text-[11px] font-semibold tracking-[0.14em] uppercase">
            Questions{questions.length > 0 ? ` (${questions.length})` : ""}
          </h2>
          {questions.length > 0 ? (
            <form action={markAllMyQuestionsReadAction}>
              <button type="submit" className="text-muted text-sm hover:underline">
                Tout marquer comme lu
              </button>
            </form>
          ) : null}
        </div>

        {questions.length === 0 ? (
          <p className="border-border text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
            Aucune nouvelle question.
          </p>
        ) : (
          qGroups.map((cl) => (
            <div key={cl.className ?? "perso"} className="flex flex-col gap-3">
              {qGroups.length > 1 ? (
                <h3 className={classHeading}>{cl.className ?? "Mes cours personnels"}</h3>
              ) : null}
              {cl.courses.map((co) => (
                <div key={co.courseId} className="flex flex-col gap-2">
                  <h4 className={courseHeading}>{co.courseName}</h4>
                  <ul className="flex flex-col gap-3">
                    {co.items.map((q) => (
                      <li key={q.id}>
                        <QuestionRow q={q} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      {/* Résumés */}
      <section id="resumes" className="flex scroll-mt-20 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-brand text-[11px] font-semibold tracking-[0.14em] uppercase">
            Résumés{summaries.length > 0 ? ` (${summaries.length})` : ""}
          </h2>
          {summaries.length > 0 ? (
            <form action={markAllMySummariesReadAction}>
              <button type="submit" className="text-muted text-sm hover:underline">
                Tout marquer comme lu
              </button>
            </form>
          ) : null}
        </div>

        {summaries.length === 0 ? (
          <p className="border-border text-muted rounded-2xl border border-dashed p-5 text-center text-sm">
            Aucun nouveau résumé.
          </p>
        ) : (
          sGroups.map((cl) => (
            <div key={cl.className ?? "perso"} className="flex flex-col gap-3">
              {sGroups.length > 1 ? (
                <h3 className={classHeading}>{cl.className ?? "Mes cours personnels"}</h3>
              ) : null}
              {cl.courses.map((co) => (
                <div key={co.courseId} className="flex flex-col gap-2">
                  <h4 className={courseHeading}>{co.courseName}</h4>
                  <ul className="flex flex-col gap-1.5">
                    {co.items.map((s) => (
                      <SummaryRow key={s.id} s={s} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
