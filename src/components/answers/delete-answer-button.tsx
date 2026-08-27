"use client";

import { deleteAnswerAction } from "@/features/answers/actions";

export function DeleteAnswerButton({
  classId,
  questionId,
  answerId,
}: {
  classId: string;
  questionId: string;
  answerId: string;
}) {
  return (
    <form
      action={deleteAnswerAction}
      onSubmit={(e) => {
        if (!confirm("Supprimer cette réponse ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="answerId" value={answerId} />
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Supprimer
      </button>
    </form>
  );
}
