import Link from "next/link";
import { retakeQuizAction } from "@/features/quizzes/actions";
import type { QuizResult } from "@/features/quizzes/types";
import { Button } from "@/components/ui/button";

export function QuizResultView({ courseId, result }: { courseId: string; result: QuizResult }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <p className="text-xs tracking-wide text-zinc-500 uppercase">{result.chapterLabel}</p>
        <p className="text-4xl font-semibold">
          {result.score} / {result.total}
        </p>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">{result.percentage} %</p>
      </div>

      {result.toReview.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Questions à revoir
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {result.toReview.map((q) => (
              <li key={q.questionId}>
                <Link
                  href={`/course/${courseId}/questions/${q.questionId}`}
                  className="text-zinc-700 underline hover:text-zinc-900 dark:text-zinc-300"
                >
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-green-700 dark:text-green-400">
          Tout bon — rien à revoir cette fois.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <form action={retakeQuizAction}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="quizId" value={result.quizId} />
          <Button type="submit" variant="secondary">
            Recommencer ce quiz
          </Button>
        </form>
        <Link
          href={`/course/${courseId}/quiz`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Nouveau quiz
        </Link>
      </div>
    </div>
  );
}
