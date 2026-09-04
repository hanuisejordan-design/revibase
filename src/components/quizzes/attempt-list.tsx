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
    return <p className="text-muted text-sm">Aucun quiz pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((a) => (
        <li key={a.id}>
          <Link
            href={`/course/${courseId}/quiz/${a.id}`}
            className="border-border hover:border-brand/40 flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm"
          >
            <span>
              {a.chapterLabel} · {relativeTime(a.startedAt)}
            </span>
            <span className="text-muted">
              {a.completedAt && a.total ? `${a.score} / ${a.total}` : "à terminer"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
