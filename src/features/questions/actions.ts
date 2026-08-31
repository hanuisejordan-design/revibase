"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
import { parseInput } from "@/lib/validation/helpers";
import { sendPushToUsers } from "@/lib/push/send";
import { courseAudience } from "@/features/push/audience";
import type { QuestionKind } from "@/constants/app";
import { createQuestionSchema } from "./schema";

const IMAGE_BUCKET = "question-images";

export interface QuestionFormState {
  errors?: Record<string, string>;
  formError?: string;
}

export async function createQuestionAction(
  _prev: QuestionFormState | undefined,
  formData: FormData,
): Promise<QuestionFormState> {
  const courseId = String(formData.get("courseId") ?? "");

  const ctx = await getCourseContext(courseId);
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
    purpose: String(formData.get("purpose") ?? "help"),
    options: rawOptions,
  });
  if (!parsed.success) return { errors: parsed.errors };

  // L'image a déjà été téléversée côté client dans `{courseId}/…`. On ne garde
  // le chemin que s'il est bien préfixé par cette classe.
  const rawImagePath = String(formData.get("imagePath") ?? "").trim();
  const imagePath =
    rawImagePath.startsWith(`${courseId}/`) && !rawImagePath.includes("..")
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
    .eq("course_id", courseId)
    .maybeSingle();
  if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour cette classe." } };

  const { data, error } = await supabase
    .from("questions")
    .insert({
      course_id: courseId,
      chapter_id: parsed.data.chapterId,
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      kind: parsed.data.kind,
      purpose: parsed.data.purpose,
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

  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/course/${courseId}/questions`);
  revalidatePath(`/course/${courseId}/questions/${questionId}`);

  // Push best-effort aux autres membres du cours. Pas de notif in-app pour
  // « nouvelle question » (cf. ADR 0022 : géré par le suivi de lecture par
  // élément) — le push, lui, est explicitement voulu.
  after(async () => {
    try {
      const audience = await courseAudience(courseId, user.id);
      await sendPushToUsers(audience, {
        title: user.displayName,
        body: `a posé la question « ${parsed.data.title} »`,
        url: `/course/${courseId}/questions/${questionId}`,
      });
    } catch {
      // best-effort
    }
  });

  redirect(`/course/${courseId}/questions/${questionId}`);
}

/**
 * Modifie une question existante (titre, contexte, chapitre, options, photo).
 * Le **type** n'est pas modifiable. Réservé à l'auteur ou à un formateur.
 */
export async function updateQuestionAction(
  _prev: QuestionFormState | undefined,
  formData: FormData,
): Promise<QuestionFormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre du cours." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("questions")
    .select("author_id, kind, image_path")
    .eq("id", questionId)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .maybeSingle();
  const cur = current as { author_id: string; kind: QuestionKind; image_path: string | null } | null;
  if (!cur) return { formError: "Question introuvable." };
  if (cur.author_id !== user.id && ctx.role !== "trainer") {
    return { formError: "Tu ne peux pas modifier cette question." };
  }

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
    kind: cur.kind, // figé : on ignore ce que le formulaire enverrait
    purpose: String(formData.get("purpose") ?? "help"), // modifiable, lui
    options: rawOptions,
  });
  if (!parsed.success) return { errors: parsed.errors };

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("id", parsed.data.chapterId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour ce cours." } };

  // Résolution de la photo : nouvelle (téléversée) / retirée / inchangée.
  const rawImagePath = String(formData.get("imagePath") ?? "").trim();
  const newImagePath =
    rawImagePath.startsWith(`${courseId}/`) && !rawImagePath.includes("..") ? rawImagePath : null;
  const removeImage = String(formData.get("removeImage") ?? "") === "1";
  const finalImagePath = newImagePath ?? (removeImage ? null : cur.image_path);

  const { error: updErr } = await supabase
    .from("questions")
    .update({
      chapter_id: parsed.data.chapterId,
      title: parsed.data.title,
      body: parsed.data.body,
      purpose: parsed.data.purpose,
      image_path: finalImagePath,
    })
    .eq("id", questionId)
    .eq("course_id", courseId);

  if (updErr) {
    if (newImagePath) await supabase.storage.from(IMAGE_BUCKET).remove([newImagePath]);
    return { formError: "Enregistrement impossible. Réessaie dans un instant." };
  }

  if (cur.image_path && cur.image_path !== finalImagePath) {
    await supabase.storage.from(IMAGE_BUCKET).remove([cur.image_path]);
  }

  // Options d'un QCM / vrai-faux : on remplace en bloc.
  if (cur.kind !== "open") {
    await supabase.from("question_options").delete().eq("question_id", questionId);
    const { error: optErr } = await supabase.from("question_options").insert(
      parsed.data.options.map((o, position) => ({
        question_id: questionId,
        body: o.body,
        is_correct: o.isCorrect,
        position,
      })),
    );
    if (optErr) return { formError: "Options non enregistrées. Vérifie et réessaie." };
  }

  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/course/${courseId}/questions`);
  revalidatePath(`/course/${courseId}/questions/${questionId}`);
  redirect(`/course/${courseId}/questions/${questionId}`);
}

/** Suppression douce, réservée à l'auteur (ou à un formateur). */
export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("author_id")
    .eq("id", questionId)
    .eq("course_id", courseId)
    .maybeSingle();

  const authorId = (question as { author_id: string } | null)?.author_id;
  if (!authorId || (authorId !== user.id && ctx.role !== "trainer")) {
    redirect(`/course/${courseId}/questions/${questionId}`);
  }

  await supabase
    .from("questions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("course_id", courseId);

  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/course/${courseId}/questions`);
  redirect(`/course/${courseId}/questions`);
}
