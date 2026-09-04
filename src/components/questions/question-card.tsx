import Link from "next/link";
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
      className="border-border bg-surface text-surface-foreground hover:border-brand/40 flex flex-col gap-2 rounded-xl border p-4 transition-colors"
    >
      <h3 className="font-medium">{question.title}</h3>
      <div className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="border-border rounded-full border px-2 py-0.5">
          {question.chapterName ?? "Sans chapitre"}
        </span>
        <PurposeBadge purpose={question.purpose} />
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
          <span className="bg-background text-muted rounded-full px-2 py-0.5 font-medium">
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
