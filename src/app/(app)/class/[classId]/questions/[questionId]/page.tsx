import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/features/questions/queries";
import { relativeTime } from "@/lib/utils/date";
import { DeleteQuestionButton } from "@/components/questions/delete-question-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string; questionId: string }>;
}): Promise<Metadata> {
  const { classId, questionId } = await params;
  const question = await getQuestion(classId, questionId);
  return { title: question?.title ?? "Question" };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ classId: string; questionId: string }>;
}) {
  const { classId, questionId } = await params;
  const question = await getQuestion(classId, questionId);
  if (!question) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/class/${classId}/questions`} className="text-xs text-zinc-500 hover:underline">
        ← Questions
      </Link>

      <article className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-800">
          {question.chapterName ?? "Sans chapitre"}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{question.title}</h1>
        <p className="text-sm text-zinc-500">
          Posée par {question.authorName} · {relativeTime(question.createdAt)}
        </p>
        {question.body ? (
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{question.body}</p>
        ) : null}
      </article>

      <section className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        {question.answerCount} réponse{question.answerCount > 1 ? "s" : ""} ·{" "}
        {question.commentCount} commentaire{question.commentCount > 1 ? "s" : ""}
        <br />
        Les réponses et la discussion s&apos;afficheront ici aux prochaines étapes.
      </section>

      {question.isAuthor ? (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <DeleteQuestionButton classId={classId} questionId={question.id} />
        </div>
      ) : null}
    </div>
  );
}
