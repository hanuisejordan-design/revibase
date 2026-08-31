import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext, getClassNewQuestions } from "@/features/classes/queries";
import { markAllClassQuestionsReadAction } from "@/features/reads/actions";
import { PurposeBadge } from "@/components/questions/purpose-badge";
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
  const markAll = markAllClassQuestionsReadAction.bind(null, classId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link href={`/class/${classId}`} className="text-xs text-zinc-500 hover:underline">
          ← {ctx.name}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Nouvelles questions{questions.length > 0 ? ` (${questions.length})` : ""}
          </h2>
          {questions.length > 0 ? (
            <form action={markAll}>
              <button
                type="submit"
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Tout marquer comme lu
              </button>
            </form>
          ) : null}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ce que tu n&apos;as pas encore ouvert, tous cours confondus, de la plus ancienne à la plus
          récente. Une question disparaît d&apos;ici une fois que tu l&apos;as ouverte.
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
                  <PurposeBadge purpose={q.purpose} />
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
