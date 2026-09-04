"use client";

import { useState } from "react";
import type { QuestionOption } from "@/features/questions/types";
import { cn } from "@/lib/utils/cn";

/**
 * QCM / vrai-faux sur la page d'une question : on choisit une option, puis on
 * voit si c'est juste (vert / rouge). Rien n'est enregistré — l'entraînement
 * répété se fait en mode quiz.
 */
export function QuestionOptionsView({ options }: { options: QuestionOption[] }) {
  const [picked, setPicked] = useState<string | null>(null);

  if (options.length === 0) {
    return <p className="text-muted text-sm">Options manquantes pour cette question.</p>;
  }

  const answered = picked !== null;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {options.map((opt) => {
          const isPicked = picked === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(opt.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  !answered && "border-border hover:border-brand/40",
                  answered &&
                    opt.isCorrect &&
                    "border-green-400 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200",
                  answered &&
                    isPicked &&
                    !opt.isCorrect &&
                    "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200",
                  answered && !isPicked && !opt.isCorrect && "border-border text-muted",
                )}
              >
                {opt.body}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
