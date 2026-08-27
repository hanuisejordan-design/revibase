import { z } from "zod";

export const chapterNameSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(120, "120 caractères maximum."),
});

export type ChapterNameInput = z.infer<typeof chapterNameSchema>;
