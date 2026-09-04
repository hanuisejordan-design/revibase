import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { getQuestion } from "@/features/questions/queries";
import { QuestionForm } from "@/components/questions/question-form";

export const metadata: Metadata = { title: "Modifier la question" };

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ courseId: string; questionId: string }>;
}) {
  const { courseId, questionId } = await params;

  const [ctx, question, chapters] = await Promise.all([
    getCourseContext(courseId),
    getQuestion(courseId, questionId),
    listChapters(courseId),
  ]);
  if (!ctx || !question) notFound();

  if (!question.isAuthor && ctx.role !== "trainer") {
    redirect(`/course/${courseId}/questions/${questionId}`);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/course/${courseId}/questions/${questionId}`}
          className="text-muted text-xs hover:underline"
        >
          ← Question
        </Link>
        <h1 className="text-xl font-semibold">Modifier la question</h1>
      </div>
      <QuestionForm
        courseId={courseId}
        chapters={chapters}
        initial={{
          questionId: question.id,
          kind: question.kind,
          purpose: question.purpose,
          title: question.title,
          body: question.body,
          chapterId: question.chapterId,
          options: question.options.map((o) => ({ body: o.body, isCorrect: o.isCorrect })),
          imageUrl: question.imageUrl,
        }}
      />
    </div>
  );
}
