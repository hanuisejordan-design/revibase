import type { CommentItem } from "@/features/discussions/types";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { DeleteCommentButton } from "./delete-comment-button";

export function CommentList({
  comments,
  courseId,
  questionId,
  viewerId,
  viewerIsTrainer,
}: {
  comments: CommentItem[];
  courseId: string;
  questionId: string;
  viewerId: string;
  viewerIsTrainer: boolean;
}) {
  if (comments.length === 0) {
    return <p className="text-muted text-sm">Aucun message pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => {
        const mine = comment.authorId === viewerId;
        return (
          <li
            key={comment.id}
            className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
          >
            <div className="text-muted flex items-baseline gap-2 px-1 text-xs">
              <span className="text-muted font-medium">{mine ? "Toi" : comment.authorName}</span>
              <span>{relativeTime(comment.createdAt)}</span>
              {mine || viewerIsTrainer ? (
                <DeleteCommentButton
                  courseId={courseId}
                  questionId={questionId}
                  commentId={comment.id}
                />
              ) : null}
            </div>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                mine
                  ? "bg-brand text-brand-foreground rounded-br-sm"
                  : "bg-background text-foreground rounded-bl-sm",
              )}
            >
              {comment.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
