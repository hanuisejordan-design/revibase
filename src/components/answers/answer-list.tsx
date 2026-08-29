import type { AnswerItem } from "@/features/answers/types";
import { AnswerCard } from "./answer-card";

export function AnswerList({
  answers,
  classId,
  questionId,
  viewerId,
  viewerIsTrainer,
  questionAuthorId,
}: {
  answers: AnswerItem[];
  classId: string;
  questionId: string;
  viewerId: string;
  viewerIsTrainer: boolean;
  questionAuthorId: string;
}) {
  if (answers.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucune réponse pour l&apos;instant. Sois le premier à répondre.
      </p>
    );
  }

  return (
    <>
      <p className="text-xs text-zinc-500">
        👍 = « je donnerais cette réponse aussi ». Ta réponse est déjà comptée ; tu peux
        aussi soutenir celle d&apos;un autre.
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {answers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            classId={classId}
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
