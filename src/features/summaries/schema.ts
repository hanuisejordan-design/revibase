import { z } from "zod";

export const createSummarySchema = z.object({
  title: z.string().trim().min(1, "Donne un titre.").max(200, "200 caractères maximum."),
  chapterId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .pipe(z.uuid("Chapitre invalide.").nullable()),
});

export type CreateSummaryInput = z.infer<typeof createSummarySchema>;
