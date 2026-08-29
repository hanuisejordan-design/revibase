"use client";

import { toggleVoteAction } from "@/features/answers/actions";
import { cn } from "@/lib/utils/cn";

/**
 * « 👍 » = « je donnerais cette réponse aussi ». On peut soutenir la réponse
 * d'un autre même si on a posté la sienne ; sa propre réponse est déjà
 * comptée automatiquement. Positif seulement, pas de « pouce bas ».
 */
export function VoteButton({
  classId,
  questionId,
  answerId,
  active,
}: {
  classId: string;
  questionId: string;
  answerId: string;
  active: boolean;
}) {
  return (
    <form action={toggleVoteAction}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="answerId" value={answerId} />
      <button
        type="submit"
        aria-pressed={active}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
          active
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500",
        )}
      >
        <span aria-hidden>{active ? "✓" : "👍"}</span>
        {active ? "Tu donnes cette réponse" : "Moi aussi je donnerais ça"}
      </button>
    </form>
  );
}
