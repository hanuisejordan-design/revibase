"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { parseInput } from "@/lib/validation/helpers";
import { createGroupSchema, joinGroupSchema } from "./schema";

export interface GroupFormState {
  errors?: Record<string, string>;
  formError?: string;
}

export async function createGroupAction(
  _prev: GroupFormState | undefined,
  formData: FormData,
): Promise<GroupFormState> {
  const parsed = parseInput(createGroupSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", { p_name: parsed.data.name });

  if (error || !data) {
    return { formError: "Impossible de créer le groupe. Réessaie dans un instant." };
  }

  revalidatePath("/dashboard");
  redirect(`/group/${data as string}`);
}

export async function joinGroupAction(
  _prev: GroupFormState | undefined,
  formData: FormData,
): Promise<GroupFormState> {
  const parsed = parseInput(joinGroupSchema, { code: formData.get("code") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_group_by_code", { p_code: parsed.data.code });

  if (error || !data) {
    return { formError: "Code de groupe invalide." };
  }

  revalidatePath("/dashboard");
  redirect(`/group/${data as string}`);
}

/** Quitte un groupe (perd l'accès à ses classes, sauf adhésion explicite). */
export async function leaveGroupAction(formData: FormData): Promise<void> {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) redirect("/dashboard");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
