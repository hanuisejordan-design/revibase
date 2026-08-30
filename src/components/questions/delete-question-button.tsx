"use client";

import { deleteQuestionAction } from "@/features/questions/actions";

export function DeleteQuestionButton({
  courseId,
  questionId,
}: {
  courseId: string;
  questionId: string;
}) {
  return (
    <form
      action={deleteQuestionAction}
      onSubmit={(e) => {
        if (!confirm("Supprimer cette question ? Cette action est définitive pour la classe.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="questionId" value={questionId} />
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Supprimer la question
      </button>
    </form>
  );
}
