import type { CommentItem } from "@/features/discussions/types";
import { relativeTime } from "@/lib/utils/date";
import { DeleteCommentButton } from "./delete-comment-button";

export function CommentList({
  comments,
  classId,
  questionId,
  viewerId,
  viewerIsTrainer,
}: {
  comments: CommentItem[];
  classId: string;
  questionId: string;
  viewerId: string;
  viewerIsTrainer: boolean;
}) {
  if (comments.length === 0) {
    return <p className="text-sm text-zinc-500">Aucun message pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <li key={comment.id} className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2 text-xs text-zinc-500">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {comment.authorName}
            </span>
            <span>{relativeTime(comment.createdAt)}</span>
            {comment.authorId === viewerId || viewerIsTrainer ? (
              <DeleteCommentButton
                classId={classId}
                questionId={questionId}
                commentId={comment.id}
              />
            ) : null}
          </div>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {comment.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
