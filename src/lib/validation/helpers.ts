import { z } from "zod";

/** Chaîne obligatoire, nettoyée des espaces superflus. */
export const requiredText = z.string().trim().min(1, "Ce champ est requis.");

/** Identifiant UUID (clé primaire côté base). */
export const uuid = z.string().uuid("Identifiant invalide.");

/**
 * Applique un schéma Zod et renvoie un résultat exploitable dans une
 * Server Action : soit les données typées, soit un dictionnaire d'erreurs
 * par champ, prêt à afficher.
 */
export function parseInput<Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown,
): { success: true; data: z.infer<Schema> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    errors[key] ??= issue.message;
  }
  return { success: false, errors };
}
