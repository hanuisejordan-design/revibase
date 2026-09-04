import type { AnswerItem, AnswerStatus } from "@/features/answers/types";
import { relativeTime } from "@/lib/utils/date";
import { AnswerStatusBadge } from "./answer-status-badge";
import { VoteButton } from "./vote-button";
import { AcceptButton } from "./accept-button";
import { ValidateButton } from "./validate-button";
import { DeleteAnswerButton } from "./delete-answer-button";

function statusOf(answer: AnswerItem): AnswerStatus {
  if (answer.validated) return "validated";
  if (answer.accepted) return "accepted";
  if (answer.isTopVoted) return "community";
  return "unverified";
}

export function AnswerCard({
  answer,
  courseId,
  questionId,
  viewerId,
  viewerIsTrainer,
  questionAuthorId,
}: {
  answer: AnswerItem;
  courseId: string;
  questionId: string;
  viewerId: string;
  viewerIsTrainer: boolean;
  questionAuthorId: string;
}) {
  const canModerate = answer.authorId === viewerId || viewerIsTrainer;
  const canAccept = viewerId === questionAuthorId;

  return (
    <li className="border-border flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AnswerStatusBadge status={statusOf(answer)} />
        <p className="text-muted whitespace-pre-wrap">{answer.body}</p>
        <div>
          <VoteButton
            courseId={courseId}
            questionId={questionId}
            answerId={answer.id}
            count={answer.voteCount}
            active={answer.viewerHasVoted}
          />
        </div>
        <div className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>
            {answer.authorName} · {relativeTime(answer.createdAt)}
          </span>
          {canAccept ? (
            <AcceptButton
              courseId={courseId}
              questionId={questionId}
              answerId={answer.id}
              accepted={answer.accepted}
            />
          ) : null}
          {viewerIsTrainer ? (
            <ValidateButton
              courseId={courseId}
              questionId={questionId}
              answerId={answer.id}
              validated={answer.validated}
            />
          ) : null}
          {canModerate ? (
            <DeleteAnswerButton courseId={courseId} questionId={questionId} answerId={answer.id} />
          ) : null}
        </div>
      </div>
    </li>
  );
}
