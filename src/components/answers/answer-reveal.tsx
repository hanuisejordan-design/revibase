"use client";

import { useState, type ReactNode } from "react";

/**
 * Sur une question ouverte, on ne montre pas les réponses des autres tant
 * qu'on n'a pas répondu soi-même (cf. ADR 0014) — pour ne pas s'auto-influencer.
 * Échappatoire « voir sans répondre » pour le cas révision.
 *
 * `children` = la liste des réponses (rendue côté serveur).
 */
export function AnswerReveal({
  hasAnswered,
  answerCount,
  children,
}: {
  hasAnswered: boolean;
  answerCount: number;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);

  if (hasAnswered || answerCount === 0 || revealed) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
      <p className="text-zinc-600 dark:text-zinc-400">
        {answerCount} réponse{answerCount > 1 ? "s" : ""} pour l&apos;instant masquée
        {answerCount > 1 ? "s" : ""}. Réponds d&apos;abord — tu compareras ensuite sans
        te faire influencer.
      </p>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-fit text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Voir les {answerCount} réponse{answerCount > 1 ? "s" : ""} sans répondre
      </button>
    </div>
  );
}
