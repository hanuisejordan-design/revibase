import { toggleSummaryPinAction } from "@/features/summaries/actions";
import { cn } from "@/lib/utils/cn";

/** Étoile ☆ / ★ : favori privé de l'utilisateur courant. */
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
          "px-1 text-base leading-none transition-colors",
          pinned
            ? "text-amber-500"
            : "text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400",
        )}
      >
        {pinned ? "★" : "☆"}
      </button>
    </form>
  );
}
