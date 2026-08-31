import { z } from "zod";
import { MCQ_MAX_OPTIONS, MCQ_MIN_OPTIONS, QUESTION_KINDS, QUESTION_PURPOSES } from "@/constants/app";

export const questionOptionInput = z.object({
  body: z.string().trim().min(1, "Option vide.").max(500, "500 caractères maximum."),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z
  .object({
    title: z.string().trim().min(5, "Au moins 5 caractères.").max(300, "300 caractères maximum."),
    body: z
      .string()
      .trim()
      .max(5000, "5000 caractères maximum.")
      .transform((v) => (v === "" ? null : v)),
    // Chapitre obligatoire : chaque question doit être classée (bibliothèque
    // structurée + quiz par chapitre).
    chapterId: z
      .string()
      .trim()
      .min(1, "Choisis un chapitre pour classer ta question.")
      .pipe(z.string().uuid("Chapitre invalide.")),
    kind: z.enum(QUESTION_KINDS),
    purpose: z.enum(QUESTION_PURPOSES).default("help"),
    options: z.array(questionOptionInput).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.kind === "open") return;

    if (val.options.length < MCQ_MIN_OPTIONS) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Au moins deux options." });
    }
    if (val.kind === "mcq" && val.options.length > MCQ_MAX_OPTIONS) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: `${MCQ_MAX_OPTIONS} options maximum.`,
      });
    }
    if (val.options.filter((o) => o.isCorrect).length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Coche exactement une bonne réponse.",
      });
    }
  });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const QUESTION_SORTS = ["recent", "unanswered", "popular"] as const;
export type QuestionSort = (typeof QUESTION_SORTS)[number];

export function parseSort(value: string | undefined): QuestionSort {
  return QUESTION_SORTS.includes(value as QuestionSort) ? (value as QuestionSort) : "recent";
}

/** Filtre d'intention pour la liste des questions, ou `undefined` = toutes. */
export function parsePurpose(value: string | undefined): "help" | "challenge" | undefined {
  return value === "help" || value === "challenge" ? value : undefined;
}
