import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/dal";
import { getClassContext } from "@/features/classes/queries";
import { getQuestion } from "@/features/questions/queries";
import { listAnswers } from "@/features/answers/queries";
import { relativeTime } from "@/lib/utils/date";
import { DeleteQuestionButton } from "@/components/questions/delete-question-button";
import { AnswerList } from "@/components/answers/answer-list";
import { CreateAnswerForm } from "@/components/answers/create-answer-form";

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

  const [ctx, user, answers] = await Promise.all([
    getClassContext(classId),
    getUser(),
    listAnswers(questionId),
  ]);
  if (!ctx || !user) notFound();

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

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          {answers.length} réponse{answers.length > 1 ? "s" : ""}
        </h2>
        <AnswerList
          answers={answers}
          classId={classId}
          questionId={question.id}
          viewerId={user.id}
          viewerIsTrainer={ctx.role === "trainer"}
          questionAuthorId={question.authorId}
        />
      </section>

      <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <CreateAnswerForm classId={classId} questionId={question.id} />
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        {question.commentCount} commentaire{question.commentCount > 1 ? "s" : ""} — la discussion
        s&apos;affichera ici à la prochaine étape.
      </section>

      {question.isAuthor ? (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <DeleteQuestionButton classId={classId} questionId={question.id} />
        </div>
      ) : null}
    </div>
  );
}
