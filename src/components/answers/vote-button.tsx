"use client";

import { toggleVoteAction } from "@/features/answers/actions";
import { cn } from "@/lib/utils/cn";

export function VoteButton({
  classId,
  questionId,
  answerId,
  count,
  active,
}: {
  classId: string;
  questionId: string;
  answerId: string;
  count: number;
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
          "flex min-w-[3rem] flex-col items-center rounded-lg border px-2 py-1 text-sm transition-colors",
          active
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500",
        )}
      >
        <span aria-hidden>▲</span>
        <span className="font-medium">{count}</span>
      </button>
    </form>
  );
}
