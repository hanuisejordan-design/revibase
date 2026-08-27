import { z } from "zod";

/**
 * Validation des variables d'environnement.
 *
 * On les référence explicitement (et non via un accès dynamique) pour que
 * Next.js puisse remplacer les `NEXT_PUBLIC_*` au moment du build.
 *
 * Ce module n'est importé qu'à partir de la Phase 1 (authentification).
 * Tant qu'aucune route ne l'importe, un `.env.local` n'est pas nécessaire.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    "Variables d'environnement manquantes ou invalides.\n" +
      "Copie .env.example vers .env.local puis renseigne les valeurs.\n" +
      details,
  );
}

export const clientEnv = parsed.data;
