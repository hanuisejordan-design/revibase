"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCourseContext } from "@/features/courses/queries";
import { parseInput } from "@/lib/validation/helpers";
import { chapterNameSchema } from "./schema";

export interface ChapterFormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
}

/** Renvoie `true` si l'utilisateur courant est membre de la classe. */
async function isMemberOf(courseId: string): Promise<boolean> {
  const ctx = await getCourseContext(courseId);
  return ctx !== null;
}

/** Chapitres d'un cours (id + nom), pour un sélecteur côté client. */
export async function listCourseChaptersAction(
  courseId: string,
): Promise<{ id: string; name: string }[]> {
  if (!courseId || !(await isMemberOf(courseId))) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("course_id", courseId)
    .order("position", { ascending: true });
  return (data ?? []) as { id: string; name: string }[];
}

function revalidateClass(courseId: string) {
  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/course/${courseId}/settings`);
}

export async function createChapterAction(
  _prev: ChapterFormState | undefined,
  formData: FormData,
): Promise<ChapterFormState> {
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await isMemberOf(courseId))) {
    return { formError: "Tu dois être membre de la classe." };
  }

  const parsed = parseInput(chapterNameSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("chapters")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = ((last as { position: number } | null)?.position ?? -1) + 1;

  const { error } = await supabase
    .from("chapters")
    .insert({ course_id: courseId, name: parsed.data.name, position });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Un chapitre porte déjà ce nom."
          : "Création impossible. Réessaie.",
    };
  }

  revalidateClass(courseId);
  return { ok: true };
}

export async function renameChapterAction(
  _prev: ChapterFormState | undefined,
  formData: FormData,
): Promise<ChapterFormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  if (!(await isMemberOf(courseId))) {
    return { formError: "Tu dois être membre de la classe." };
  }

  const parsed = parseInput(chapterNameSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("chapters")
    .update({ name: parsed.data.name })
    .eq("id", chapterId)
    .eq("course_id", courseId);

  if (error) {
    return {
      formError:
        error.code === "23505" ? "Un chapitre porte déjà ce nom." : "Modification impossible.",
    };
  }

  revalidateClass(courseId);
  return { ok: true };
}

export async function deleteChapterAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  if (!(await isMemberOf(courseId))) return;

  const supabase = await createClient();
  await supabase.from("chapters").delete().eq("id", chapterId).eq("course_id", courseId);

  revalidateClass(courseId);
}

export async function moveChapterAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!(await isMemberOf(courseId))) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select("id, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const list = (data ?? []) as Array<{ id: string; position: number }>;
  const index = list.findIndex((c) => c.id === chapterId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= list.length) return;

  const a = list[index];
  const b = list[target];
  await supabase.from("chapters").update({ position: b.position }).eq("id", a.id);
  await supabase.from("chapters").update({ position: a.position }).eq("id", b.id);

  revalidateClass(courseId);
}
