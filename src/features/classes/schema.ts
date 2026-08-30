import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(120, "120 caractères maximum."),
});

export const joinClassSchema = z.object({
  code: z.string().trim().toUpperCase().min(4, "Code trop court.").max(16, "Code trop long."),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type JoinClassInput = z.infer<typeof joinClassSchema>;
