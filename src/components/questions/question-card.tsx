import Link from "next/link";
import type { QuestionListItem } from "@/features/questions/types";
import { relativeTime } from "@/lib/utils/date";
import { QuestionStatusBadge } from "./question-status-badge";

export function QuestionCard({
  classId,
  question,
}: {
  classId: string;
  question: QuestionListItem;
}) {
  return (
    <Link
      href={`/class/${classId}/questions/${question.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <h3 className="font-medium">{question.title}</h3>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <span className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-800">
          {question.chapterName ?? "Sans chapitre"}
        </span>
        <span>
          {question.answerCount} réponse{question.answerCount > 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>
          {question.commentCount} commentaire{question.commentCount > 1 ? "s" : ""}
        </span>
        <QuestionStatusBadge status={question.status} />
        <span className="ml-auto">
          {question.authorName} · {relativeTime(question.createdAt)}
        </span>
      </div>
    </Link>
  );
}
