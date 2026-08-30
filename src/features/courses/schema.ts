import { z } from "zod";

export const createCourseSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(120, "120 caractères maximum."),
});

export const joinCourseSchema = z.object({
  code: z.string().trim().toUpperCase().min(4, "Code trop court.").max(16, "Code trop long."),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type JoinCourseInput = z.infer<typeof joinCourseSchema>;
