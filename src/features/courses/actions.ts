"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { parseInput } from "@/lib/validation/helpers";
import { createCourseSchema, joinCourseSchema } from "./schema";

export interface CourseFormState {
  errors?: Record<string, string>;
  formError?: string;
}

export async function createCourseAction(
  _prev: CourseFormState | undefined,
  formData: FormData,
): Promise<CourseFormState> {
  const parsed = parseInput(createCourseSchema, { name: formData.get("name") });
  if (!parsed.success) return { errors: parsed.errors };

  const classId = String(formData.get("classId") ?? "").trim() || null;
  const isTrainer = formData.get("isTrainer") === "on";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_course", {
    p_name: parsed.data.name,
    p_is_trainer: isTrainer,
    ...(classId ? { p_class_id: classId } : {}),
  });

  if (error || !data) {
    return { formError: "Impossible de créer le cours. Réessaie dans un instant." };
  }

  revalidatePath("/dashboard");
  if (classId) revalidatePath(`/class/${classId}`);
  redirect(`/course/${data as string}`);
}

export async function joinCourseAction(
  _prev: CourseFormState | undefined,
  formData: FormData,
): Promise<CourseFormState> {
  const parsed = parseInput(joinCourseSchema, { code: formData.get("code") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_course_by_code", {
    p_code: parsed.data.code,
  });

  if (error || !data) {
    return { formError: "Code de cours invalide." };
  }

  revalidatePath("/dashboard");
  redirect(`/course/${data as string}`);
}

/** Quitte un cours. Réservé aux membres non créateurs (garde-fou côté UI). */
export async function leaveCourseAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) redirect("/dashboard");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.from("course_members").delete().eq("course_id", courseId).eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Gestion des rôles d'un membre du cours — réservé à un admin du cours. */
async function courseAdminGuard(courseId: string) {
  const user = await getUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("course_members")
    .select("is_admin")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!(me as { is_admin: boolean } | null)?.is_admin) {
    redirect(`/course/${courseId}/settings`);
  }
  return { user, supabase };
}

/** Donne / retire le statut d'admin à un membre du cours. */
export async function setCourseAdminAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const value = String(formData.get("value") ?? "") === "1";
  if (!courseId || !userId) redirect("/dashboard");

  const { supabase } = await courseAdminGuard(courseId);

  // On ne retire jamais le dernier admin.
  if (!value) {
    const { count } = await supabase
      .from("course_members")
      .select("user_id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("is_admin", true);
    if ((count ?? 0) <= 1) redirect(`/course/${courseId}/settings`);
  }

  await supabase
    .from("course_members")
    .update({ is_admin: value })
    .eq("course_id", courseId)
    .eq("user_id", userId);

  revalidatePath(`/course/${courseId}/settings`);
  redirect(`/course/${courseId}/settings`);
}

/** Donne / retire le rôle formateur à un membre du cours. */
export async function setCourseTrainerAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const value = String(formData.get("value") ?? "") === "1";
  if (!courseId || !userId) redirect("/dashboard");

  const { supabase } = await courseAdminGuard(courseId);

  await supabase
    .from("course_members")
    .update({ role: value ? "trainer" : "student" })
    .eq("course_id", courseId)
    .eq("user_id", userId);

  revalidatePath(`/course/${courseId}/settings`);
  revalidatePath(`/course/${courseId}`);
  redirect(`/course/${courseId}/settings`);
}
