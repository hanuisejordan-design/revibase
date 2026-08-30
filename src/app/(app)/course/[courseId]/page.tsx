import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { getRecentQuestions } from "@/features/questions/queries";
import { QuestionCard } from "@/components/questions/question-card";

export default async function ClassHomePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const [chapters, recent] = await Promise.all([
    listChapters(courseId),
    getRecentQuestions(courseId, 5),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/course/${courseId}/questions/new`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Poser une question
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Questions récentes
          </h2>
          {recent.length > 0 ? (
            <Link
              href={`/course/${courseId}/questions`}
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Voir tout
            </Link>
          ) : null}
        </div>
        {recent.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {recent.map((question) => (
              <li key={question.id}>
                <QuestionCard courseId={courseId} question={question} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Aucune question pour l&apos;instant.</p>
        )}
      </section>

      {chapters.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Chapitres</h2>
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
