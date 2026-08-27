import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string;
}

/**
 * Utilisateur courant, ou `null` si non connecté.
 *
 * Utilise `getUser()` (le JWT est revérifié côté Supabase) plutôt que
 * `getSession()`. Mémoïsé avec `cache()` : un seul aller-retour par rendu,
 * même si plusieurs composants l'appellent.
 */
export const getUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? user.email ?? "Utilisateur",
  };
});

/**
 * Comme `getUser()`, mais redirige vers `/login` si personne n'est connecté.
 * À appeler en tête des layouts / pages de la zone connectée.
 */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
});
