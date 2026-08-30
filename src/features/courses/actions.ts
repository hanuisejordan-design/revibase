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

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_course", {
    p_name: parsed.data.name,
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

/** Quitte une classe. Réservé aux membres non créateurs (garde-fou côté UI). */
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
