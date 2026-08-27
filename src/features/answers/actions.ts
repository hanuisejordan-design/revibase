"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getClassContext } from "@/features/classes/queries";
import { parseInput } from "@/lib/validation/helpers";
import { createAnswerSchema } from "./schema";

export interface AnswerFormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
}

function revalidateQuestion(classId: string, questionId: string) {
  revalidatePath(`/class/${classId}/questions/${questionId}`);
  revalidatePath(`/class/${classId}/questions`);
  revalidatePath(`/class/${classId}`);
}

export async function createAnswerAction(
  _prev: AnswerFormState | undefined,
  formData: FormData,
): Promise<AnswerFormState> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre de la classe." };

  const parsed = parseInput(createAnswerSchema, { body: formData.get("body") });
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

  const { error } = await supabase.from("answers").insert({
    question_id: questionId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { formError: "Publication impossible. Réessaie." };

  revalidateQuestion(classId, questionId);
  return { ok: true };
}

export async function toggleVoteAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) redirect("/login");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("answer_votes")
    .select("id")
    .eq("answer_id", answerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("answer_votes")
      .delete()
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("answer_votes").insert({ answer_id: answerId, user_id: user.id });
  }

  revalidateQuestion(classId, questionId);
}

export async function toggleAcceptAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) redirect("/login");

  const supabase = await createClient();
  // Le RPC vérifie que l'appelant est bien l'auteur de la question.
  await supabase.rpc("accept_answer", { p_answer: answerId });

  revalidateQuestion(classId, questionId);
}

export async function deleteAnswerAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) redirect("/login");

  const supabase = await createClient();
  const { data: answer } = await supabase
    .from("answers")
    .select("author_id")
    .eq("id", answerId)
    .maybeSingle();

  const authorId = (answer as { author_id: string } | null)?.author_id;
  if (authorId && (authorId === user.id || ctx.role === "trainer")) {
    await supabase.from("answers").delete().eq("id", answerId);
    revalidateQuestion(classId, questionId);
  }
}
