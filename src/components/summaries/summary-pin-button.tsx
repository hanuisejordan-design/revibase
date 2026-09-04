import { Star } from "lucide-react";
import { toggleSummaryPinAction } from "@/features/summaries/actions";
import { cn } from "@/lib/utils/cn";

/** Étoile : favori privé de l'utilisateur courant. */
export function SummaryPinButton({
  courseId,
  summaryId,
  pinned,
}: {
  courseId: string;
  summaryId: string;
  pinned: boolean;
}) {
  return (
    <form action={toggleSummaryPinAction} className="flex items-center">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="summaryId" value={summaryId} />
      <button
        type="submit"
        aria-pressed={pinned}
        aria-label={pinned ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={cn(
          "px-1 transition-colors",
          pinned ? "text-amber-500" : "text-muted/50 hover:text-muted",
        )}
      >
        <Star size={16} aria-hidden fill={pinned ? "currentColor" : "none"} />
      </button>
    </form>
  );
}
