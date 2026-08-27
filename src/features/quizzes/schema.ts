import { z } from "zod";
import { QUIZ_MAX_QUESTIONS, QUIZ_MIN_QUESTIONS } from "@/constants/app";

const optionalChapterId = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().uuid("Chapitre invalide.").nullable());

export const createQuizSchema = z.object({
  chapterId: optionalChapterId,
  count: z.coerce
    .number()
    .int("Nombre invalide.")
    .min(QUIZ_MIN_QUESTIONS, `Au moins ${QUIZ_MIN_QUESTIONS} question.`)
    .max(QUIZ_MAX_QUESTIONS, `${QUIZ_MAX_QUESTIONS} questions maximum.`),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const submitQuizSchema = z.object({
  results: z
    .array(
      z.object({
        quizQuestionId: z.string().uuid(),
        knewIt: z.boolean(),
      }),
    )
    .min(1),
});
