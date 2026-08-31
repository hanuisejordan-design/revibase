import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * IDs des membres d'un cours : adhésion directe (`course_members`) + accès via
 * la classe propriétaire (`class_members`), dédoublonnés, `exclude` retiré.
 * Sert à cibler les push « nouvelle question / nouveau résumé ».
 */
export async function courseAudience(courseId: string, exclude?: string): Promise<string[]> {
  const supabase = await createClient();

  const [{ data: direct }, { data: course }] = await Promise.all([
    supabase.from("course_members").select("user_id").eq("course_id", courseId),
    supabase.from("courses").select("class_id").eq("id", courseId).maybeSingle(),
  ]);

  const ids = new Set<string>(
    ((direct ?? []) as Array<{ user_id: string }>).map((r) => r.user_id),
  );

  const classId = (course as { class_id: string | null } | null)?.class_id ?? null;
  if (classId) {
    const { data: viaClass } = await supabase
      .from("class_members")
      .select("user_id")
      .eq("class_id", classId);
    for (const r of (viaClass ?? []) as Array<{ user_id: string }>) ids.add(r.user_id);
  }

  if (exclude) ids.delete(exclude);
  return [...ids];
}
