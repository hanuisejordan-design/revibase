import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
import { getQuestion } from "@/features/questions/queries";
import { listAnswers } from "@/features/answers/queries";
import { listComments } from "@/features/discussions/queries";
import { relativeTime } from "@/lib/utils/date";
import { QUESTION_KIND_LABELS } from "@/constants/app";
import { DeleteQuestionButton } from "@/components/questions/delete-question-button";
import { QuestionOptionsView } from "@/components/questions/question-options-view";
import { AnswerList } from "@/components/answers/answer-list";
import { AnswerReveal } from "@/components/answers/answer-reveal";
import { CreateAnswerForm } from "@/components/answers/create-answer-form";
import { CommentList } from "@/components/discussions/comment-list";
import { CreateCommentForm } from "@/components/discussions/create-comment-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; questionId: string }>;
}): Promise<Metadata> {
  const { courseId, questionId } = await params;
  const question = await getQuestion(courseId, questionId);
  return { title: question?.title ?? "Question" };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ courseId: string; questionId: string }>;
}) {
  const { courseId, questionId } = await params;

  const question = await getQuestion(courseId, questionId);
  if (!question) notFound();

  const isOpen = question.kind === "open";

  const [ctx, user, answers, comments] = await Promise.all([
    getCourseContext(courseId),
    getUser(),
    isOpen ? listAnswers(questionId) : Promise.resolve([]),
    listComments(questionId),
  ]);
  if (!ctx || !user) notFound();

  // A répondu, ou a déjà voté / fusionné sa réponse : dans tous les cas il a
  // participé, on ne lui masque plus les réponses des autres.
  const viewerHasAnswered =
    isOpen && answers.some((a) => a.authorId === user.id || a.viewerHasVoted);

  const answersBlock = (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        {answers.length} réponse{answers.length > 1 ? "s" : ""}
      </h2>
      <AnswerReveal hasAnswered={viewerHasAnswered} answerCount={answers.length}>
        <AnswerList
          answers={answers}
          courseId={courseId}
          questionId={question.id}
          viewerId={user.id}
          viewerIsTrainer={ctx.role === "trainer"}
          questionAuthorId={question.authorId}
        />
      </AnswerReveal>
    </section>
  );

  const answerFormBlock = (
    <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <CreateAnswerForm courseId={courseId} questionId={question.id} />
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/course/${courseId}/questions`} className="text-xs text-zinc-500 hover:underline">
        ← Questions
      </Link>

      <article className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-800">
            {question.chapterName ?? "Sans chapitre"}
          </span>
          {!isOpen ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium dark:bg-zinc-800">
              {QUESTION_KIND_LABELS[question.kind]}
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{question.title}</h1>
        <p className="text-sm text-zinc-500">
          Posée par {question.authorName} · {relativeTime(question.createdAt)}
        </p>
        {question.body ? (
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{question.body}</p>
        ) : null}
        {question.imageUrl ? (
          <a
            href={question.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt="Photo de la question"
              className="max-h-[28rem] rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
            />
          </a>
        ) : null}
      </article>

      {isOpen ? (
        viewerHasAnswered ? (
          <>
            {answersBlock}
            {answerFormBlock}
          </>
        ) : (
          <>
            {answerFormBlock}
            {answersBlock}
          </>
        )
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Réponse</h2>
          <QuestionOptionsView options={question.options} />
        </section>
      )}

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Discussion ({comments.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Pour échanger autour de la question (formulation, cas limites, « pourquoi »…).
          </p>
        </div>
        <CommentList
          comments={comments}
          courseId={courseId}
          questionId={question.id}
          viewerId={user.id}
          viewerIsTrainer={ctx.role === "trainer"}
        />
        <CreateCommentForm courseId={courseId} questionId={question.id} />
      </section>

      {question.isAuthor || ctx.role === "trainer" ? (
        <div className="flex items-center gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Link
            href={`/course/${courseId}/questions/${question.id}/edit`}
            className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Modifier
          </Link>
          <DeleteQuestionButton courseId={courseId} questionId={question.id} />
        </div>
      ) : null}
    </div>
  );
}
