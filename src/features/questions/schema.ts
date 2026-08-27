import { z } from "zod";

/** "" (aucun) ou un UUID de chapitre. */
const optionalChapterId = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().uuid("Chapitre invalide.").nullable());

export const createQuestionSchema = z.object({
  title: z.string().trim().min(5, "Au moins 5 caractères.").max(300, "300 caractères maximum."),
  body: z
    .string()
    .trim()
    .max(5000, "5000 caractères maximum.")
    .transform((v) => (v === "" ? null : v)),
  chapterId: optionalChapterId,
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const QUESTION_SORTS = ["recent", "unanswered", "popular"] as const;
export type QuestionSort = (typeof QUESTION_SORTS)[number];

export function parseSort(value: string | undefined): QuestionSort {
  return QUESTION_SORTS.includes(value as QuestionSort) ? (value as QuestionSort) : "recent";
}
