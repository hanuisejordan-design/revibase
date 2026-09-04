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
    <div className="border-border flex flex-col gap-3 rounded-xl border border-dashed p-4 text-sm">
      <p className="text-muted">
        {answerCount} réponse{answerCount > 1 ? "s" : ""} pour l&apos;instant masquée
        {answerCount > 1 ? "s" : ""}. Réponds d&apos;abord — tu compareras ensuite sans te faire
        influencer.
      </p>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="text-muted hover:text-foreground w-fit underline"
      >
        Voir les {answerCount} réponse{answerCount > 1 ? "s" : ""} sans répondre
      </button>
    </div>
  );
}
