import Link from "next/link";
import type { AttemptSummary } from "@/features/quizzes/types";
import { relativeTime } from "@/lib/utils/date";

export function AttemptList({
  courseId,
  attempts,
}: {
  courseId: string;
  attempts: AttemptSummary[];
}) {
  if (attempts.length === 0) {
    return <p className="text-sm text-zinc-500">Aucun quiz pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((a) => (
        <li key={a.id}>
          <Link
            href={`/course/${courseId}/quiz/${a.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <span>
              {a.chapterLabel} · {relativeTime(a.startedAt)}
            </span>
            <span className="text-zinc-500">
              {a.completedAt && a.total ? `${a.score} / ${a.total}` : "à terminer"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
