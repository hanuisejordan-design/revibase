"use client";

import { useState } from "react";
import { submitQuizAction } from "@/features/quizzes/actions";
import type { QuizQuestionCard } from "@/features/quizzes/types";
import { Button } from "@/components/ui/button";

const REFERENCE_LABEL: Record<string, string> = {
  validated: "Réponse validée par un formateur",
  accepted: "Réponse retenue par l'auteur",
  community: "Réponse la plus votée",
};

export function QuizRunner({
  classId,
  attemptId,
  questions,
}: {
  classId: string;
  attemptId: string;
  questions: QuizQuestionCard[];
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ quizQuestionId: string; knewIt: boolean }[]>([]);

  const done = index >= questions.length;
  const current = questions[index];

  function record(knewIt: boolean) {
    setResults((prev) => [...prev, { quizQuestionId: current.quizQuestionId, knewIt }]);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (done) {
    const known = results.filter((r) => r.knewIt).length;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Terminé — tu as coché « je savais » pour {known} / {questions.length}.
        </p>
        <form action={submitQuizAction}>
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="attemptId" value={attemptId} />
          <input type="hidden" name="results" value={JSON.stringify(results)} />
          <Button type="submit">Voir mon score</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        Question {index + 1} / {questions.length}
      </p>

      <div className="flex flex-col gap-2">
        {current.chapterName ? (
          <span className="w-fit rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-800">
            {current.chapterName}
          </span>
        ) : null}
        <h2 className="text-lg font-semibold">{current.title}</h2>
        {current.body ? (
          <p className="text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
            {current.body}
          </p>
        ) : null}
      </div>

      {!revealed ? (
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
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            {current.referenceAnswer ? (
              <>
                <p className="mb-1 text-xs font-medium text-zinc-500">
                  {current.referenceKind
                    ? REFERENCE_LABEL[current.referenceKind]
                    : "Réponse proposée"}
                </p>
                <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {current.referenceAnswer}
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Pas encore de réponse de référence pour cette question — évalue-toi honnêtement.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={() => record(true)}>
              Je savais
            </Button>
            <Button type="button" variant="secondary" onClick={() => record(false)}>
              À revoir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
