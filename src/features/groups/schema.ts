import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(120, "120 caractères maximum."),
});

export const joinGroupSchema = z.object({
  code: z.string().trim().toUpperCase().min(4, "Code trop court.").max(16, "Code trop long."),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
