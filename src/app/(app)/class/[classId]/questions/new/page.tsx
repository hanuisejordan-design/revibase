import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext } from "@/features/classes/queries";
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
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { classId } = await params;
  const sp = await searchParams;
  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const chapters = await listChapters(classId);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/class/${classId}/questions`}
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Questions
        </Link>
        <h2 className="text-lg font-semibold">Poser une question</h2>
      </div>
      <CreateQuestionForm
        classId={classId}
        chapters={chapters}
        defaultChapterId={first(sp.chapter)}
      />
    </div>
  );
}
