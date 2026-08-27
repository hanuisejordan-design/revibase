import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext } from "@/features/classes/queries";
import { listChapters } from "@/features/chapters/queries";
import { listQuestions } from "@/features/questions/queries";
import { parseSort } from "@/features/questions/schema";
import { QuestionCard } from "@/components/questions/question-card";
import { QuestionFilters } from "@/components/questions/question-filters";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function QuestionsPage({
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

  const chapter = first(sp.chapter);
  const q = first(sp.q);
  const sort = parseSort(first(sp.sort));

  const [chapters, questions, allForChips] = await Promise.all([
    listChapters(classId),
    listQuestions(classId, { chapter, search: q, sort }),
    listQuestions(classId, {}),
  ]);

  const hasUnchaptered = allForChips.some((item) => item.chapterId === null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Questions</h2>
        <Link
          href={`/class/${classId}/questions/new`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Poser une question
        </Link>
      </div>

      <QuestionFilters
        classId={classId}
        chapters={chapters}
        params={{ chapter, q, sort }}
        hasUnchaptered={hasUnchaptered}
      />

      {questions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {questions.map((question) => (
            <li key={question.id}>
              <QuestionCard classId={classId} question={question} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {q || chapter || sort !== "recent"
            ? "Aucune question ne correspond à ces filtres."
            : "Aucune question pour l'instant. Sois le premier à en poser une."}
        </p>
      )}
    </div>
  );
}
