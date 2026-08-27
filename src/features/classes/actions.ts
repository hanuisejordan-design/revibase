"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { parseInput } from "@/lib/validation/helpers";
import { createClassSchema, joinClassSchema } from "./schema";

export interface ClassFormState {
  errors?: Record<string, string>;
  formError?: string;
}

export async function createClassAction(
  _prev: ClassFormState | undefined,
  formData: FormData,
): Promise<ClassFormState> {
  const parsed = parseInput(createClassSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_class", {
    p_name: parsed.data.name,
  });

  if (error || !data) {
    return { formError: "Impossible de créer la classe. Réessaie dans un instant." };
  }

  revalidatePath("/dashboard");
  redirect(`/class/${data as string}`);
}

export async function joinClassAction(
  _prev: ClassFormState | undefined,
  formData: FormData,
): Promise<ClassFormState> {
  const parsed = parseInput(joinClassSchema, { code: formData.get("code") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_class_by_code", {
    p_code: parsed.data.code,
  });

  if (error || !data) {
    return { formError: "Code de classe invalide." };
  }

  revalidatePath("/dashboard");
  redirect(`/class/${data as string}`);
}

/** Quitte une classe. Réservé aux membres non créateurs (garde-fou côté UI). */
export async function leaveClassAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  if (!classId) redirect("/dashboard");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.from("class_members").delete().eq("class_id", classId).eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
