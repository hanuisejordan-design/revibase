import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { QuestionListItem } from "@/features/questions/types";
import { relativeTime } from "@/lib/utils/date";
import { QUESTION_KIND_LABELS } from "@/constants/app";
import { QuestionStatusBadge } from "./question-status-badge";
import { PurposeBadge } from "./purpose-badge";

export function QuestionCard({
  courseId,
  question,
}: {
  courseId: string;
  question: QuestionListItem;
}) {
  const isOpen = question.kind === "open";

  return (
    <Link
      href={`/course/${courseId}/questions/${question.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <h3 className="font-medium">{question.title}</h3>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <span className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-800">
          {question.chapterName ?? "Sans chapitre"}
        </span>
        <PurposeBadge purpose={question.purpose} />
        {question.imageUrl ? (
          <ImageIcon size={13} aria-label="Photo jointe" className="text-muted" />
        ) : null}
        {isOpen ? (
          <>
            <span>
              {question.answerCount} réponse{question.answerCount > 1 ? "s" : ""}
            </span>
            <span>·</span>
          </>
        ) : null}
        <span>
          {question.commentCount} commentaire{question.commentCount > 1 ? "s" : ""}
        </span>
        {isOpen ? (
          <QuestionStatusBadge status={question.status} />
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {QUESTION_KIND_LABELS[question.kind]}
          </span>
        )}
        <span className="ml-auto">
          {question.authorName} · {relativeTime(question.createdAt)}
        </span>
      </div>
    </Link>
  );
}
