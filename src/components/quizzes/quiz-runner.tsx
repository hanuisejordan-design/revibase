"use client";

import { useState } from "react";
import { submitQuizAction } from "@/features/quizzes/actions";
import type { QuizQuestionCard } from "@/features/quizzes/types";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const REFERENCE_LABEL: Record<string, string> = {
  validated: "Réponse validée par un formateur",
  accepted: "Réponse retenue par l'auteur",
  community: "Réponse la plus votée",
};

type Result = {
  quizQuestionId: string;
  knewIt?: boolean;
  selectedOptionId?: string;
};

export function QuizRunner({
  courseId,
  attemptId,
  questions,
}: {
  courseId: string;
  attemptId: string;
  questions: QuizQuestionCard[];
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const done = index >= questions.length;
  const current = questions[index];

  function next(result: Result) {
    setResults((prev) => [...prev, result]);
    setRevealed(false);
    setPicked(null);
    setIndex((i) => i + 1);
  }

  if (done) {
    const known = results.reduce((n, r, i) => {
      const q = questions[i];
      if (!q) return n;
      if (q.kind === "open") return n + (r.knewIt ? 1 : 0);
      const opt = q.options.find((o) => o.id === r.selectedOptionId);
      return n + (opt?.isCorrect ? 1 : 0);
    }, 0);

    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted text-sm">
          Terminé — {known} / {questions.length} bonne{known > 1 ? "s" : ""} réponse
          {known > 1 ? "s" : ""}.
        </p>
        <form action={submitQuizAction}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="attemptId" value={attemptId} />
          <input type="hidden" name="results" value={JSON.stringify(results)} />
          <Button type="submit">Voir mon score</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-xs font-medium tracking-wide uppercase">
        Question {index + 1} / {questions.length}
      </p>

      <div className="flex flex-col gap-2">
        {current.chapterName ? (
          <span className="border-border text-muted w-fit rounded-full border px-2 py-0.5 text-xs">
            {current.chapterName}
          </span>
        ) : null}
        <h2 className="text-lg font-semibold">{current.title}</h2>
        {current.body ? (
          <p className="text-muted text-sm whitespace-pre-wrap">{current.body}</p>
        ) : null}
        {current.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.imageUrl}
            alt="Photo de la question"
            className="border-border max-h-72 rounded-lg border object-contain"
          />
        ) : null}
      </div>

      {current.kind === "open" ? (
        !revealed ? (
          <Button
            type="button"
            variant="secondary"
            className="w-fit"
            onClick={() => setRevealed(true)}
          >
            Voir la réponse de référence
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="border-border rounded-xl border p-4">
              {current.referenceAnswer ? (
                <>
                  <p className="text-muted mb-1 text-xs font-medium">
                    {current.referenceKind
                      ? REFERENCE_LABEL[current.referenceKind]
                      : "Réponse proposée"}
                  </p>
                  <p className="text-muted text-sm whitespace-pre-wrap">
                    {current.referenceAnswer}
                  </p>
                </>
              ) : (
                <p className="text-muted text-sm">
                  Pas encore de réponse de référence — évalue-toi honnêtement.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => next({ quizQuestionId: current.quizQuestionId, knewIt: true })}
              >
                Je savais
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => next({ quizQuestionId: current.quizQuestionId, knewIt: false })}
              >
                À revoir
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {current.options.map((opt) => {
              const isPicked = picked === opt.id;
              const showResult = picked !== null;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled={showResult}
                    onClick={() => setPicked(opt.id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      !showResult && "border-border hover:border-brand/40",
                      showResult &&
                        opt.isCorrect &&
                        "border-green-400 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200",
                      showResult &&
                        isPicked &&
                        !opt.isCorrect &&
                        "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200",
                      showResult && !isPicked && !opt.isCorrect && "border-border text-muted",
                    )}
                  >
                    {opt.body}
                  </button>
                </li>
              );
            })}
          </ul>
          {picked !== null ? (
            <Button
              type="button"
              className="w-fit"
              onClick={() =>
                next({ quizQuestionId: current.quizQuestionId, selectedOptionId: picked })
              }
            >
              {index + 1 < questions.length ? "Question suivante" : "Terminer"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
