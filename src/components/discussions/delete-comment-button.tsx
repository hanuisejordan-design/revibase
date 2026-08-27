"use client";

import { deleteCommentAction } from "@/features/discussions/actions";

export function DeleteCommentButton({
  classId,
  questionId,
  commentId,
}: {
  classId: string;
  questionId: string;
  commentId: string;
}) {
  return (
    <form
      action={deleteCommentAction}
      onSubmit={(e) => {
        if (!confirm("Supprimer ce message ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="commentId" value={commentId} />
      <button
        type="submit"
        className="text-xs text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Supprimer
      </button>
    </form>
  );
}
