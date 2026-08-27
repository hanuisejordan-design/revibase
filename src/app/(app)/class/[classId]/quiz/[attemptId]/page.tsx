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
  params: Promise<{ classId: string; attemptId: string }>;
}) {
  const { classId, attemptId } = await params;

  const result = await getResult(classId, attemptId);
  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <Link href={`/class/${classId}/quiz`} className="text-xs text-zinc-500 hover:underline">
          ← Quiz
        </Link>
        <h1 className="text-xl font-semibold">Résultat</h1>
        <QuizResultView classId={classId} result={result} />
      </div>
    );
  }

  const runner = await getRunnerData(classId, attemptId);
  if (!runner) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/class/${classId}/quiz`} className="text-xs text-zinc-500 hover:underline">
        ← Quitter le quiz
      </Link>
      <QuizRunner classId={classId} attemptId={attemptId} questions={runner.questions} />
    </div>
  );
}
