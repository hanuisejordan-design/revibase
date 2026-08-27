import { z } from "zod";

export const createAnswerSchema = z.object({
  body: z.string().trim().min(1, "Écris une réponse.").max(5000, "5000 caractères maximum."),
});

export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
