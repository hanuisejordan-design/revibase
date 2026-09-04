import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { getRecentQuestions } from "@/features/questions/queries";
import { listSummaries } from "@/features/summaries/queries";
import { QuestionCard } from "@/components/questions/question-card";
import { SummaryRow } from "@/components/summaries/summary-list";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background";
const sectionTitle = "text-xs font-semibold tracking-wide text-muted uppercase";
const seeAll = "text-sm text-muted hover:underline";

export default async function CourseHomePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const [recentQuestions, allSummaries] = await Promise.all([
    getRecentQuestions(courseId, 5),
    listSummaries(courseId),
  ]);
  const recentSummaries = allSummaries.slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <div className="hidden flex-wrap gap-3 md:flex">
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
          <p className="text-muted text-sm">Aucune question pour l&apos;instant.</p>
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
          <p className="text-muted text-sm">Aucun résumé pour l&apos;instant.</p>
        )}
      </section>
    </div>
  );
}
