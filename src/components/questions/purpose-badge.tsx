import { QUESTION_PURPOSE_SHORT, type QuestionPurpose } from "@/constants/app";

const CLS: Record<QuestionPurpose, string> = {
  help: "border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400",
  challenge:
    "bg-violet-100 font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

/** Pastille d'intention d'une question : « Besoin d'aide » ou « Défi ». */
export function PurposeBadge({ purpose }: { purpose: QuestionPurpose }) {
  return (
    <span className={`rounded-full px-2 py-0.5 ${CLS[purpose]}`}>
      {QUESTION_PURPOSE_SHORT[purpose]}
    </span>
  );
}
