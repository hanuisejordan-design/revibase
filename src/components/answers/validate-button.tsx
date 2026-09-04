"use client";

import { toggleValidateAction } from "@/features/answers/actions";
import { cn } from "@/lib/utils/cn";

export function ValidateButton({
  courseId,
  questionId,
  answerId,
  validated,
}: {
  courseId: string;
  questionId: string;
  answerId: string;
  validated: boolean;
}) {
  return (
    <form action={toggleValidateAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="answerId" value={answerId} />
      <button
        type="submit"
        className={cn(
          "text-sm underline",
          validated
            ? "text-green-700 hover:text-green-900 dark:text-green-400"
            : "text-muted hover:text-foreground",
        )}
      >
        {validated ? "Retirer la validation" : "Valider (formateur)"}
      </button>
    </form>
  );
}
