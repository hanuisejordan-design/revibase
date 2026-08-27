"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getClassContext } from "@/features/classes/queries";
import { parseInput } from "@/lib/validation/helpers";
import { createQuestionSchema } from "./schema";

export interface QuestionFormState {
  errors?: Record<string, string>;
  formError?: string;
}

export async function createQuestionAction(
  _prev: QuestionFormState | undefined,
  formData: FormData,
): Promise<QuestionFormState> {
  const classId = String(formData.get("classId") ?? "");

  const ctx = await getClassContext(classId);
  if (!ctx) return { formError: "Tu dois être membre de la classe." };

  const parsed = parseInput(createQuestionSchema, {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    chapterId: String(formData.get("chapterId") ?? ""),
  });
  if (!parsed.success) return { errors: parsed.errors };

  const user = await getUser();
  if (!user) return { formError: "Session expirée. Reconnecte-toi." };

  const supabase = await createClient();

  // Le chapitre choisi doit appartenir à cette classe.
  if (parsed.data.chapterId) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("id", parsed.data.chapterId)
      .eq("class_id", classId)
      .maybeSingle();
    if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour cette classe." } };
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      class_id: classId,
      chapter_id: parsed.data.chapterId,
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { formError: "Publication impossible. Réessaie dans un instant." };
  }

  revalidatePath(`/class/${classId}`);
  revalidatePath(`/class/${classId}/questions`);
  redirect(`/class/${classId}/questions/${data.id as string}`);
}

/** Suppression douce, réservée à l'auteur (ou à un formateur). */
export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("author_id")
    .eq("id", questionId)
    .eq("class_id", classId)
    .maybeSingle();

  const authorId = (question as { author_id: string } | null)?.author_id;
  if (!authorId || (authorId !== user.id && ctx.role !== "trainer")) {
    redirect(`/class/${classId}/questions/${questionId}`);
  }

  await supabase
    .from("questions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("class_id", classId);

  revalidatePath(`/class/${classId}`);
  revalidatePath(`/class/${classId}/questions`);
  redirect(`/class/${classId}/questions`);
}
