"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
import { parseInput } from "@/lib/validation/helpers";
import { sendPushToUsers } from "@/lib/push/send";
import { createCommentSchema } from "./schema";

export interface CommentFormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
}

function revalidateQuestion(courseId: string, questionId: string) {
  revalidatePath(`/course/${courseId}/questions/${questionId}`);
  revalidatePath(`/course/${courseId}/questions`);
  revalidatePath(`/course/${courseId}`);
}

export async function createCommentAction(
  _prev: CommentFormState | undefined,
  formData: FormData,
): Promise<CommentFormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre de la classe." };

  const parsed = parseInput(createCommentSchema, { body: formData.get("body") });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();

  const { data: question } = await supabase
    .from("questions")
    .select("id, author_id, title")
    .eq("id", questionId)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!question) return { formError: "Question introuvable." };
  const q = question as { id: string; author_id: string; title: string };

  const { error } = await supabase.from("comments").insert({
    question_id: questionId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { formError: "Envoi impossible. Réessaie." };

  revalidateQuestion(courseId, questionId);

  // Push best-effort à l'auteur de la question (notif in-app = trigger
  // `comments_notify`).
  if (q.author_id !== user.id) {
    after(() =>
      sendPushToUsers([q.author_id], {
        title: user.displayName,
        body: `a commenté « ${q.title} »`,
        url: `/course/${courseId}/questions/${questionId}`,
      }),
    );
  }

  return { ok: true };
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const commentId = String(formData.get("commentId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
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
    revalidateQuestion(courseId, questionId);
  }
}
