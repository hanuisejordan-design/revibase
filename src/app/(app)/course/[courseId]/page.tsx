import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { getRecentQuestions } from "@/features/questions/queries";
import { listSummaries } from "@/features/summaries/queries";
import { QuestionCard } from "@/components/questions/question-card";
import { SummaryRow } from "@/components/summaries/summary-list";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";
const sectionTitle = "text-xs font-semibold tracking-wide text-zinc-500 uppercase";
const seeAll = "text-sm text-zinc-600 hover:underline dark:text-zinc-400";

export default async function CourseHomePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const [chapters, recentQuestions, allSummaries] = await Promise.all([
    listChapters(courseId),
    getRecentQuestions(courseId, 5),
    listSummaries(courseId),
  ]);
  const recentSummaries = allSummaries.slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <Link href={`/course/${courseId}/questions/new`} className={primaryBtn}>
          Poser une question
        </Link>
        <Link href={`/course/${courseId}/summaries/new`} className={secondaryBtn}>
          Ajouter un résumé
        </Link>
        <Link href={`/course/${courseId}/quiz`} className={secondaryBtn}>
          Faire un quiz
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Questions récentes</h2>
          {recentQuestions.length > 0 ? (
            <Link href={`/course/${courseId}/questions`} className={seeAll}>
              Voir tout
            </Link>
          ) : null}
        </div>
        {recentQuestions.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {recentQuestions.map((question) => (
              <li key={question.id}>
                <QuestionCard courseId={courseId} question={question} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Aucune question pour l&apos;instant.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Résumés récents</h2>
          {recentSummaries.length > 0 ? (
            <Link href={`/course/${courseId}/summaries`} className={seeAll}>
              Voir tout
            </Link>
          ) : null}
        </div>
        {recentSummaries.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {recentSummaries.map((s) => (
              <SummaryRow key={s.id} summary={s} courseId={courseId} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Aucun résumé pour l&apos;instant.</p>
        )}
      </section>

      {chapters.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className={sectionTitle}>Chapitres</h2>
          <ul className="flex flex-wrap gap-2">
            {chapters.map((ch) => (
              <li key={ch.id}>
                <Link
                  href={`/course/${courseId}/questions?chapter=${ch.id}`}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  {ch.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
