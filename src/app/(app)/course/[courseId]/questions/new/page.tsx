import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { CreateQuestionForm } from "@/components/questions/create-question-form";

export const metadata: Metadata = { title: "Poser une question" };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { courseId } = await params;
  const sp = await searchParams;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const chapters = await listChapters(courseId);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/course/${courseId}/questions`}
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Questions
        </Link>
        <h2 className="text-lg font-semibold">Poser une question</h2>
      </div>

      {chapters.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          <p>
            Cette classe n&apos;a pas encore de chapitre. Il en faut au moins un pour classer les
            questions.
          </p>
          <Link href={`/course/${courseId}/settings`} className="font-medium underline">
            Créer un chapitre
          </Link>
        </div>
      ) : (
        <CreateQuestionForm
          courseId={courseId}
          chapters={chapters}
          defaultChapterId={first(sp.chapter)}
        />
      )}
    </div>
  );
}
