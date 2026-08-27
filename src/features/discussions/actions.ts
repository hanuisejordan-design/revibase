"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getClassContext } from "@/features/classes/queries";
import { parseInput } from "@/lib/validation/helpers";
import { createCommentSchema } from "./schema";

export interface CommentFormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
}

function revalidateQuestion(classId: string, questionId: string) {
  revalidatePath(`/class/${classId}/questions/${questionId}`);
  revalidatePath(`/class/${classId}/questions`);
  revalidatePath(`/class/${classId}`);
}

export async function createCommentAction(
  _prev: CommentFormState | undefined,
  formData: FormData,
): Promise<CommentFormState> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre de la classe." };

  const parsed = parseInput(createCommentSchema, { body: formData.get("body") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .eq("class_id", classId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!question) return { formError: "Question introuvable." };

  const { error } = await supabase.from("comments").insert({
    question_id: questionId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { formError: "Envoi impossible. Réessaie." };

  revalidateQuestion(classId, questionId);
  return { ok: true };
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const commentId = String(formData.get("commentId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) redirect("/login");

  const supabase = await createClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .maybeSingle();

  const authorId = (comment as { author_id: string } | null)?.author_id;
  if (authorId && (authorId === user.id || ctx.role === "trainer")) {
    await supabase.from("comments").delete().eq("id", commentId);
    revalidateQuestion(classId, questionId);
  }
}
