import type { AnswerItem } from "@/features/answers/types";
import { AnswerCard } from "./answer-card";

export function AnswerList({
  answers,
  courseId,
  questionId,
  viewerId,
  viewerIsTrainer,
  questionAuthorId,
}: {
  answers: AnswerItem[];
  courseId: string;
  questionId: string;
  viewerId: string;
  viewerIsTrainer: boolean;
  questionAuthorId: string;
}) {
  if (answers.length === 0) {
    return (
      <p className="text-muted text-sm">
        Aucune réponse pour l&apos;instant. Sois le premier à répondre.
      </p>
    );
  }

  return (
    <>
      <p className="text-muted text-xs">
        👍 = « je donnerais cette réponse aussi ». Ta réponse est déjà comptée ; tu peux aussi
        soutenir celle d&apos;un autre.
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {answers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            courseId={courseId}
            questionId={questionId}
            viewerId={viewerId}
            viewerIsTrainer={viewerIsTrainer}
            questionAuthorId={questionAuthorId}
          />
        ))}
      </ul>
    </>
  );
}
