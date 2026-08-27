"use client";

import { toggleValidateAction } from "@/features/answers/actions";
import { cn } from "@/lib/utils/cn";

export function ValidateButton({
  classId,
  questionId,
  answerId,
  validated,
}: {
  classId: string;
  questionId: string;
  answerId: string;
  validated: boolean;
}) {
  return (
    <form action={toggleValidateAction}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="answerId" value={answerId} />
      <button
        type="submit"
        className={cn(
          "text-sm underline",
          validated
            ? "text-green-700 hover:text-green-900 dark:text-green-400"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
        )}
      >
        {validated ? "Retirer la validation" : "Valider (formateur)"}
      </button>
    </form>
  );
}
