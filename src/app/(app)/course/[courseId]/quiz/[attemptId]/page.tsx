import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRunnerData, getResult } from "@/features/quizzes/queries";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { QuizResultView } from "@/components/quizzes/quiz-result";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizAttemptPage({
  params,
}: {
  params: Promise<{ courseId: string; attemptId: string }>;
}) {
  const { courseId, attemptId } = await params;

  const result = await getResult(courseId, attemptId);
  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <Link href={`/course/${courseId}/quiz`} className="text-xs text-zinc-500 hover:underline">
          ← Quiz
        </Link>
        <h1 className="text-xl font-semibold">Résultat</h1>
        <QuizResultView courseId={courseId} result={result} />
      </div>
    );
  }

  const runner = await getRunnerData(courseId, attemptId);
  if (!runner) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/course/${courseId}/quiz`} className="text-xs text-zinc-500 hover:underline">
        ← Quitter le quiz
      </Link>
      <QuizRunner courseId={courseId} attemptId={attemptId} questions={runner.questions} />
    </div>
  );
}
