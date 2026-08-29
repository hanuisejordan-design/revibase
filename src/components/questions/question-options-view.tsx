import type { QuestionOption } from "@/features/questions/types";
import { cn } from "@/lib/utils/cn";

/** Affiche les options d'un QCM / vrai-faux, la bonne mise en évidence. */
export function QuestionOptionsView({ options }: { options: QuestionOption[] }) {
  if (options.length === 0) {
    return <p className="text-sm text-zinc-500">Options manquantes pour cette question.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {options.map((opt) => (
        <li
          key={opt.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
            opt.isCorrect
              ? "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-zinc-200 dark:border-zinc-800",
          )}
        >
          <span aria-hidden className="w-4 text-green-700 dark:text-green-400">
            {opt.isCorrect ? "✓" : ""}
          </span>
          <span>{opt.body}</span>
        </li>
      ))}
    </ul>
  );
}
