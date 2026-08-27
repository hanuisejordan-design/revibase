import type { AnswerStatus } from "@/features/answers/types";
import { cn } from "@/lib/utils/cn";

const LABELS: Record<AnswerStatus, string> = {
  validated: "Validée par un formateur",
  accepted: "Retenue par l'auteur",
  community: "Réponse communautaire",
  unverified: "",
};

const STYLES: Record<AnswerStatus, string> = {
  validated: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  accepted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  community: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  unverified: "",
};

export function AnswerStatusBadge({ status }: { status: AnswerStatus }) {
  if (status === "unverified") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {status === "validated" || status === "accepted" ? "✓ " : null}
      {LABELS[status]}
    </span>
  );
}
