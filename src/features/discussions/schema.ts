import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Écris un message.").max(5000, "5000 caractères maximum."),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
