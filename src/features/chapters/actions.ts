"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClassContext } from "@/features/classes/queries";
import { parseInput } from "@/lib/validation/helpers";
import { chapterNameSchema } from "./schema";

export interface ChapterFormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
}

/** Renvoie `true` si l'utilisateur courant est membre de la classe. */
async function isMemberOf(classId: string): Promise<boolean> {
  const ctx = await getClassContext(classId);
  return ctx !== null;
}

function revalidateClass(classId: string) {
  revalidatePath(`/class/${classId}`);
  revalidatePath(`/class/${classId}/settings`);
}

export async function createChapterAction(
  _prev: ChapterFormState | undefined,
  formData: FormData,
): Promise<ChapterFormState> {
  const classId = String(formData.get("classId") ?? "");
  if (!(await isMemberOf(classId))) {
    return { formError: "Tu dois être membre de la classe." };
  }

  const parsed = parseInput(chapterNameSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("chapters")
    .select("position")
    .eq("class_id", classId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = ((last as { position: number } | null)?.position ?? -1) + 1;

  const { error } = await supabase
    .from("chapters")
    .insert({ class_id: classId, name: parsed.data.name, position });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Un chapitre porte déjà ce nom."
          : "Création impossible. Réessaie.",
    };
  }

  revalidateClass(classId);
  return { ok: true };
}

export async function renameChapterAction(
  _prev: ChapterFormState | undefined,
  formData: FormData,
): Promise<ChapterFormState> {
  const classId = String(formData.get("classId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  if (!(await isMemberOf(classId))) {
    return { formError: "Tu dois être membre de la classe." };
  }

  const parsed = parseInput(chapterNameSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("chapters")
    .update({ name: parsed.data.name })
    .eq("id", chapterId)
    .eq("class_id", classId);

  if (error) {
    return {
      formError:
        error.code === "23505" ? "Un chapitre porte déjà ce nom." : "Modification impossible.",
    };
  }

  revalidateClass(classId);
  return { ok: true };
}

export async function deleteChapterAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  if (!(await isMemberOf(classId))) return;

  const supabase = await createClient();
  await supabase.from("chapters").delete().eq("id", chapterId).eq("class_id", classId);

  revalidateClass(classId);
}

export async function moveChapterAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!(await isMemberOf(classId))) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select("id, position")
    .eq("class_id", classId)
    .order("position", { ascending: true });

  const list = (data ?? []) as Array<{ id: string; position: number }>;
  const index = list.findIndex((c) => c.id === chapterId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= list.length) return;

  const a = list[index];
  const b = list[target];
  await supabase.from("chapters").update({ position: b.position }).eq("id", a.id);
  await supabase.from("chapters").update({ position: a.position }).eq("id", b.id);

  revalidateClass(classId);
}
