import type { QuestionStatus } from "@/features/questions/types";
import { cn } from "@/lib/utils/cn";

const LABELS: Record<QuestionStatus, string> = {
  validated: "Réponse validée",
  answered: "Réponse communautaire",
  unanswered: "Sans réponse",
};

const STYLES: Record<QuestionStatus, string> = {
  validated: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  answered: "bg-background text-muted",
  unanswered: "border border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
};

export function QuestionStatusBadge({ status }: { status: QuestionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
