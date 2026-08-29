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

  let rawOptions: unknown = [];
  try {
    rawOptions = JSON.parse(String(formData.get("optionsJson") ?? "[]"));
  } catch {
    rawOptions = [];
  }

  const parsed = parseInput(createQuestionSchema, {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    chapterId: String(formData.get("chapterId") ?? ""),
    kind: String(formData.get("kind") ?? "open"),
    options: rawOptions,
  });
  if (!parsed.success) return { errors: parsed.errors };

  // L'image a déjà été téléversée côté client dans `{classId}/…`. On ne garde
  // le chemin que s'il est bien préfixé par cette classe.
  const rawImagePath = String(formData.get("imagePath") ?? "").trim();
  const imagePath =
    rawImagePath.startsWith(`${classId}/`) && !rawImagePath.includes("..")
      ? rawImagePath
      : null;

  const user = await getUser();
  if (!user) return { formError: "Session expirée. Reconnecte-toi." };

  const supabase = await createClient();

  // Le chapitre choisi doit appartenir à cette classe.
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("id", parsed.data.chapterId)
    .eq("class_id", classId)
    .maybeSingle();
  if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour cette classe." } };

  const { data, error } = await supabase
    .from("questions")
    .insert({
      class_id: classId,
      chapter_id: parsed.data.chapterId,
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      kind: parsed.data.kind,
      image_path: imagePath,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (imagePath) await supabase.storage.from("question-images").remove([imagePath]);
    return { formError: "Publication impossible. Réessaie dans un instant." };
  }

  const questionId = data.id as string;

  if (parsed.data.kind !== "open") {
    const { error: optErr } = await supabase.from("question_options").insert(
      parsed.data.options.map((o, position) => ({
        question_id: questionId,
        body: o.body,
        is_correct: o.isCorrect,
        position,
      })),
    );
    if (optErr) {
      // Pas de transaction inter-requêtes : on annule la question orpheline.
      await supabase.from("questions").delete().eq("id", questionId);
      if (imagePath) await supabase.storage.from("question-images").remove([imagePath]);
      return { formError: "Publication impossible. Réessaie dans un instant." };
    }
  }

  revalidatePath(`/class/${classId}`);
  revalidatePath(`/class/${classId}/questions`);
  revalidatePath(`/class/${classId}/questions/${questionId}`);
  redirect(`/class/${classId}/questions/${questionId}`);
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
