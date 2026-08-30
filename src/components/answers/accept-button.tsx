"use client";

import { toggleAcceptAction } from "@/features/answers/actions";
import { cn } from "@/lib/utils/cn";

export function AcceptButton({
  courseId,
  questionId,
  answerId,
  accepted,
}: {
  courseId: string;
  questionId: string;
  answerId: string;
  accepted: boolean;
}) {
  return (
    <form action={toggleAcceptAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="answerId" value={answerId} />
      <button
        type="submit"
        className={cn(
          "text-sm underline",
          accepted
            ? "text-indigo-700 hover:text-indigo-900 dark:text-indigo-400"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
        )}
      >
        {accepted ? "Retirer « retenue »" : "Retenir cette réponse"}
      </button>
    </form>
  );
}
