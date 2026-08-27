import { z } from "zod";

/** E-mail : on nettoie (espaces, casse) AVANT de valider le format. */
const email = z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide."));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Mot de passe requis."),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Au moins 2 caractères.").max(80, "80 caractères maximum."),
  email,
  password: z.string().min(8, "Au moins 8 caractères."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
