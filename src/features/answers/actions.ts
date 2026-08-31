"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
import { parseInput } from "@/lib/validation/helpers";
import { sendPushToUsers } from "@/lib/push/send";
import { createAnswerSchema } from "./schema";
import { isSameAnswer } from "./normalize";

export interface AnswerFormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
  /** Renseigné quand la réponse a rejoint une réponse existante (vote ajouté). */
  merged?: { authorName: string };
}

function revalidateQuestion(courseId: string, questionId: string) {
  revalidatePath(`/course/${courseId}/questions/${questionId}`);
  revalidatePath(`/course/${courseId}/questions`);
  revalidatePath(`/course/${courseId}`);
}

export async function createAnswerAction(
  _prev: AnswerFormState | undefined,
  formData: FormData,
): Promise<AnswerFormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre de la classe." };

  const parsed = parseInput(createAnswerSchema, { body: formData.get("body") });
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

  // Doublon exact ? On ne recrée pas la réponse : on ajoute un vote à celle
  // qui existe déjà (cf. ADR 0014). Comparaison stricte, pas de correction
  // des fautes.
  const { data: existing } = await supabase
    .from("answers")
    .select("id, body, author:profiles!answers_author_id_fkey(display_name)")
    .eq("question_id", questionId);

  const rows = (existing ?? []) as unknown as Array<{
    id: string;
    body: string;
    author: { display_name: string } | null;
  }>;
  const match = rows.find((r) => isSameAnswer(r.body, parsed.data.body));

  if (match) {
    await supabase
      .from("answer_votes")
      .upsert(
        { answer_id: match.id, user_id: user.id },
        { onConflict: "answer_id,user_id", ignoreDuplicates: true },
      );
    revalidateQuestion(courseId, questionId);
    return { ok: true, merged: { authorName: match.author?.display_name ?? "un autre membre" } };
  }

  const { data: created, error } = await supabase
    .from("answers")
    .insert({ question_id: questionId, author_id: user.id, body: parsed.data.body })
    .select("id")
    .single();
  if (error || !created) return { formError: "Publication impossible. Réessaie." };

  // L'auteur « vote » automatiquement pour sa propre réponse : le compteur
  // veut dire « nombre de personnes ayant donné cette réponse ».
  await supabase
    .from("answer_votes")
    .upsert(
      { answer_id: (created as { id: string }).id, user_id: user.id },
      { onConflict: "answer_id,user_id", ignoreDuplicates: true },
    );

  revalidateQuestion(courseId, questionId);

  // Push best-effort à l'auteur de la question (la notif in-app est écrite
  // par le trigger `answers_notify`).
  if (q.author_id !== user.id) {
    after(() =>
      sendPushToUsers([q.author_id], {
        title: user.displayName,
        body: `a répondu à « ${q.title} »`,
        url: `/course/${courseId}/questions/${questionId}`,
      }),
    );
  }

  return { ok: true };
}

export async function toggleVoteAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
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

  revalidateQuestion(courseId, questionId);
}

export async function toggleAcceptAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || !ctx) redirect("/login");

  const supabase = await createClient();
  // Le RPC vérifie que l'appelant est bien l'auteur de la question.
  await supabase.rpc("accept_answer", { p_answer: answerId });

  revalidateQuestion(courseId, questionId);
}

/** Validation officielle d'une réponse. Réservée aux formateurs (RLS + trigger). */
export async function toggleValidateAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
  if (!user || ctx?.role !== "trainer") redirect(`/course/${courseId}/questions/${questionId}`);

  const supabase = await createClient();
  const { data: answer } = await supabase
    .from("answers")
    .select("validated_by, author_id")
    .eq("id", answerId)
    .maybeSingle();

  const ans = answer as { validated_by: string | null; author_id: string } | null;
  const currentlyValidated = ans?.validated_by;
  // Le trigger `enforce_answer_validation` force validated_by = auth.uid() et
  // gère validated_at ; on se contente d'activer / désactiver.
  await supabase
    .from("answers")
    .update({ validated_by: currentlyValidated ? null : user.id })
    .eq("id", answerId);

  revalidateQuestion(courseId, questionId);

  // Push best-effort à l'auteur de la réponse quand on vient de la valider.
  if (ans && !currentlyValidated && ans.author_id !== user.id) {
    const { data: question } = await supabase
      .from("questions")
      .select("title")
      .eq("id", questionId)
      .maybeSingle();
    const title = (question as { title: string } | null)?.title ?? "ta réponse";
    after(() =>
      sendPushToUsers([ans.author_id], {
        title: user.displayName,
        body: `a validé ta réponse à « ${title} »`,
        url: `/course/${courseId}/questions/${questionId}`,
      }),
    );
  }
}

export async function deleteAnswerAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const answerId = String(formData.get("answerId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
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
    revalidateQuestion(courseId, questionId);
  }
}
