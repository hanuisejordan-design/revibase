import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext, getClassNewQuestions } from "@/features/classes/queries";
import { MarkClassSeen } from "@/components/classes/mark-class-seen";
import { relativeTime } from "@/lib/utils/date";
import { QUESTION_KIND_LABELS } from "@/constants/app";

export default async function ClassNewQuestionsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const questions = await getClassNewQuestions(classId);

  return (
    <div className="flex flex-col gap-5">
      <MarkClassSeen classId={classId} />

      <div className="flex flex-col gap-1">
        <Link href={`/class/${classId}`} className="text-xs text-zinc-500 hover:underline">
          ← {ctx.name}
        </Link>
        <h2 className="text-lg font-semibold">
          Nouvelles questions{questions.length > 0 ? ` (${questions.length})` : ""}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Depuis ta dernière visite, tous cours confondus, de la plus ancienne à la plus récente.
        </p>
      </div>

      {questions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                href={`/course/${q.courseId}/questions/${q.id}`}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <h3 className="font-medium">{q.title}</h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {q.courseName}
                  </span>
                  <span className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-800">
                    {q.chapterName ?? "Sans chapitre"}
                  </span>
                  {q.kind === "open" ? (
                    <span>
                      {q.answerCount} réponse{q.answerCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span>{QUESTION_KIND_LABELS[q.kind]}</span>
                  )}
                  <span className="ml-auto">
                    {q.authorName} · {relativeTime(q.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aucune nouvelle question. Tu es à jour.
        </p>
      )}
    </div>
  );
}
