"use client";

import { deleteSummaryAction } from "@/features/summaries/actions";

export function DeleteSummaryButton({
  courseId,
  summaryId,
}: {
  courseId: string;
  summaryId: string;
}) {
  return (
    <form
      action={deleteSummaryAction}
      onSubmit={(e) => {
        if (!confirm("Supprimer ce résumé ? Le fichier sera effacé.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="summaryId" value={summaryId} />
      <button
        type="submit"
        className="text-xs text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Supprimer
      </button>
    </form>
  );
}
