"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
import { parseInput } from "@/lib/validation/helpers";
import { sendPushToUsers } from "@/lib/push/send";
import { courseAudience } from "@/features/push/audience";
import { createSummarySchema } from "./schema";

const BUCKET = "summaries";

export interface SummaryFormState {
  errors?: Record<string, string>;
  formError?: string;
}

export async function createSummaryAction(
  _prev: SummaryFormState | undefined,
  formData: FormData,
): Promise<SummaryFormState> {
  const courseId = String(formData.get("courseId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre du cours." };

  const parsed = parseInput(createSummarySchema, {
    title: formData.get("title"),
    chapterId: String(formData.get("chapterId") ?? ""),
  });
  if (!parsed.success) return { errors: parsed.errors };

  const filePath = String(formData.get("filePath") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  if (!filePath || !fileName) return { errors: { file: "Ajoute un fichier." } };
  if (!filePath.startsWith(`${courseId}/`) || filePath.includes("..")) {
    return { formError: "Fichier invalide. Réessaie." };
  }

  const supabase = await createClient();

  if (parsed.data.chapterId) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("id", parsed.data.chapterId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour ce cours." } };
  }

  const { error } = await supabase.from("summaries").insert({
    course_id: courseId,
    chapter_id: parsed.data.chapterId,
    author_id: user.id,
    title: parsed.data.title,
    file_path: filePath,
    file_name: fileName.slice(0, 300),
  });

  if (error) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { formError: "Publication impossible. Réessaie dans un instant." };
  }

  revalidatePath(`/course/${courseId}/summaries`);
  revalidatePath(`/course/${courseId}`);

  // Push best-effort aux autres membres du cours (pas de notif in-app pour
  // les résumés — suivi de lecture par élément).
  after(async () => {
    try {
      const audience = await courseAudience(courseId, user.id);
      await sendPushToUsers(audience, {
        title: user.displayName,
        body: `a ajouté le résumé « ${parsed.data.title} »`,
        url: `/course/${courseId}/summaries`,
      });
    } catch {
      // best-effort
    }
  });

  redirect(`/course/${courseId}/summaries`);
}

/** Épingle / désépingle un résumé pour l'utilisateur courant (favori privé). */
export async function toggleSummaryPinAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const summaryId = String(formData.get("summaryId") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("summary_pins")
    .select("summary_id")
    .eq("summary_id", summaryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("summary_pins")
      .delete()
      .eq("summary_id", summaryId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("summary_pins").insert({ summary_id: summaryId, user_id: user.id });
  }

  revalidatePath(`/course/${courseId}/summaries`);
  revalidatePath(`/course/${courseId}`);
}

export async function deleteSummaryAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const summaryId = String(formData.get("summaryId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) redirect("/login");

  const supabase = await createClient();
  const { data: summary } = await supabase
    .from("summaries")
    .select("author_id, file_path")
    .eq("id", summaryId)
    .eq("course_id", courseId)
    .maybeSingle();

  const row = summary as { author_id: string; file_path: string } | null;
  if (!row) redirect(`/course/${courseId}/summaries`);
  if (row.author_id !== user.id && ctx.role !== "trainer") {
    redirect(`/course/${courseId}/summaries`);
  }

  await supabase.from("summaries").delete().eq("id", summaryId);
  await supabase.storage.from(BUCKET).remove([row.file_path]);

  revalidatePath(`/course/${courseId}/summaries`);
  redirect(`/course/${courseId}/summaries`);
}
