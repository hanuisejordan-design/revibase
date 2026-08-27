import { z } from "zod";

export const createQuestionSchema = z.object({
  title: z.string().trim().min(5, "Au moins 5 caractères.").max(300, "300 caractères maximum."),
  body: z
    .string()
    .trim()
    .max(5000, "5000 caractères maximum.")
    .transform((v) => (v === "" ? null : v)),
  // Chapitre obligatoire à la création : chaque question doit être classée
  // (bibliothèque structurée + quiz par chapitre). L'état « sans chapitre »
  // n'existe que pour les questions orphelines d'un chapitre supprimé.
  chapterId: z
    .string()
    .trim()
    .min(1, "Choisis un chapitre pour classer ta question.")
    .pipe(z.string().uuid("Chapitre invalide.")),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const QUESTION_SORTS = ["recent", "unanswered", "popular"] as const;
export type QuestionSort = (typeof QUESTION_SORTS)[number];

export function parseSort(value: string | undefined): QuestionSort {
  return QUESTION_SORTS.includes(value as QuestionSort) ? (value as QuestionSort) : "recent";
}
