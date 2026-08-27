"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseInput } from "@/lib/validation/helpers";
import { signInSchema, signUpSchema } from "./schema";

export interface AuthFormState {
  /** Erreurs de validation par champ. */
  errors?: Record<string, string>;
  /** Erreur globale (identifiants incorrects, e-mail déjà pris…). */
  formError?: string;
  /** Message d'information (ex. confirmation d'e-mail requise). */
  notice?: string;
}

/** Traduit les messages d'erreur Supabase les plus courants. */
function toFrenchAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Un compte existe déjà avec cette adresse e-mail.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Ton e-mail n'est pas encore confirmé. Vérifie ta boîte de réception.";
  }
  if (m.includes("password")) {
    return "Mot de passe trop faible (8 caractères minimum).";
  }
  return "Une erreur est survenue. Réessaie dans un instant.";
}

export async function signUpAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseInput(signUpSchema, {
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });

  if (error) return { formError: toFrenchAuthError(error.message) };

  // Pas de session => la confirmation par e-mail est activée sur le projet.
  if (!data.session) {
    return {
      notice: "Compte créé. Confirme ton adresse via l'e-mail reçu, puis connecte-toi.",
    };
  }

  redirect("/dashboard");
}

export async function signInAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseInput(signInSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { formError: toFrenchAuthError(error.message) };

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
