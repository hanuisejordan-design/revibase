"use client";

import { ThumbsUp } from "lucide-react";
import { toggleVoteAction } from "@/features/answers/actions";
import { cn } from "@/lib/utils/cn";

/**
 * Le pouce = « je donnerais cette réponse aussi ». On peut soutenir la réponse
 * d'un autre même si on a posté la sienne ; sa propre réponse est déjà
 * comptée automatiquement. Positif seulement, pas de « pouce bas ».
 */
export function VoteButton({
  courseId,
  questionId,
  answerId,
  count,
  active,
}: {
  courseId: string;
  questionId: string;
  answerId: string;
  count: number;
  active: boolean;
}) {
  return (
    <form action={toggleVoteAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="answerId" value={answerId} />
      <button
        type="submit"
        aria-pressed={active}
        aria-label={
          active
            ? "Tu donnes cette réponse — cliquer pour retirer"
            : "Moi aussi je donnerais cette réponse"
        }
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors",
          active
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border text-muted hover:border-brand/40",
        )}
      >
        <ThumbsUp size={14} aria-hidden />
        <span className="text-sm font-medium">{count > 0 ? count : "Moi aussi"}</span>
      </button>
    </form>
  );
}
