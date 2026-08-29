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
  classId,
  questionId,
  viewerId,
  viewerIsTrainer,
  questionAuthorId,
}: {
  answer: AnswerItem;
  classId: string;
  questionId: string;
  viewerId: string;
  viewerIsTrainer: boolean;
  questionAuthorId: string;
}) {
  const canModerate = answer.authorId === viewerId || viewerIsTrainer;
  const canAccept = viewerId === questionAuthorId;

  const many = answer.voteCount > 1;
  const voteLine = `👍 ${answer.voteCount} personne${many ? "s" : ""} donnerai${
    many ? "ent" : "t"
  } cette réponse${answer.voterLabels.length > 0 ? ` · ${answer.voterLabels.join(", ")}` : ""}`;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AnswerStatusBadge status={statusOf(answer)} />
        <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{answer.body}</p>
        {answer.voteCount > 0 ? <p className="text-xs text-zinc-500">{voteLine}</p> : null}
        <div>
          <VoteButton
            classId={classId}
            questionId={questionId}
            answerId={answer.id}
            active={answer.viewerHasVoted}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>
            {answer.authorName} · {relativeTime(answer.createdAt)}
          </span>
          {canAccept ? (
            <AcceptButton
              classId={classId}
              questionId={questionId}
              answerId={answer.id}
              accepted={answer.accepted}
            />
          ) : null}
          {viewerIsTrainer ? (
            <ValidateButton
              classId={classId}
              questionId={questionId}
              answerId={answer.id}
              validated={answer.validated}
            />
          ) : null}
          {canModerate ? (
            <DeleteAnswerButton classId={classId} questionId={questionId} answerId={answer.id} />
          ) : null}
        </div>
      </div>
    </li>
  );
}
