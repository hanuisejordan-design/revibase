"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getClassContext } from "@/features/classes/queries";
import { parseInput } from "@/lib/validation/helpers";
import { selectQuizQuestions } from "@/services/quiz-generator";
import { createQuizSchema, submitQuizSchema } from "./schema";

export interface QuizFormState {
  errors?: Record<string, string>;
  formError?: string;
}

async function startAttemptOnQuiz(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quizId: string,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, user_id: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error("attempt");
  return data.id as string;
}

export async function createQuizAction(
  _prev: QuizFormState | undefined,
  formData: FormData,
): Promise<QuizFormState> {
  const classId = String(formData.get("classId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getClassContext(classId)]);
  if (!user || !ctx) return { formError: "Tu dois être membre de la classe." };

  const parsed = parseInput(createQuizSchema, {
    chapterId: formData.get("chapterId"),
    count: formData.get("count"),
  });
  if (!parsed.success) return { errors: parsed.errors };

  const supabase = await createClient();

  if (parsed.data.chapterId) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("id", parsed.data.chapterId)
      .eq("class_id", classId)
      .maybeSingle();
    if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour cette classe." } };
  }

  const questionIds = await selectQuizQuestions(
    supabase,
    classId,
    parsed.data.chapterId,
    parsed.data.count,
  );
  if (questionIds.length === 0) {
    return { formError: "Aucune question disponible pour ce choix. Ajoute des questions d'abord." };
  }

  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      class_id: classId,
      created_by: user.id,
      chapter_id: parsed.data.chapterId,
      requested_count: parsed.data.count,
    })
    .select("id")
    .single();
  if (quizErr || !quiz) return { formError: "Création du quiz impossible. Réessaie." };

  const { error: qqErr } = await supabase.from("quiz_questions").insert(
    questionIds.map((questionId, position) => ({
      quiz_id: quiz.id as string,
      question_id: questionId,
      position,
    })),
  );
  if (qqErr) return { formError: "Création du quiz impossible. Réessaie." };

  const attemptId = await startAttemptOnQuiz(supabase, quiz.id as string, user.id);

  revalidatePath(`/class/${classId}/quiz`);
  redirect(`/class/${classId}/quiz/${attemptId}`);
}

export async function submitQuizAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  let parsedResults: unknown;
  try {
    parsedResults = JSON.parse(String(formData.get("results") ?? "[]"));
  } catch {
    redirect(`/class/${classId}/quiz/${attemptId}`);
  }

  const parsed = parseInput(submitQuizSchema, { results: parsedResults });
  if (!parsed.success) redirect(`/class/${classId}/quiz/${attemptId}`);
  const results = parsed.success ? parsed.data.results : [];

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, user_id, completed_at, quizzes(class_id)")
    .eq("id", attemptId)
    .maybeSingle();

  const row = attempt as unknown as {
    user_id: string;
    completed_at: string | null;
    quizzes: { class_id: string } | null;
  } | null;

  if (!row || row.user_id !== user.id || row.quizzes?.class_id !== classId) {
    redirect(`/class/${classId}/quiz`);
  }
  if (row && row.completed_at) {
    redirect(`/class/${classId}/quiz/${attemptId}`);
  }

  await supabase.from("quiz_answers").upsert(
    results.map((r) => ({
      attempt_id: attemptId,
      quiz_question_id: r.quizQuestionId,
      knew_it: r.knewIt,
      is_correct: r.knewIt,
    })),
    { onConflict: "attempt_id,quiz_question_id" },
  );

  const score = results.filter((r) => r.knewIt).length;
  await supabase
    .from("quiz_attempts")
    .update({ score, total: results.length, completed_at: new Date().toISOString() })
    .eq("id", attemptId);

  revalidatePath(`/class/${classId}/quiz`);
  redirect(`/class/${classId}/quiz/${attemptId}`);
}

export async function retakeQuizAction(formData: FormData): Promise<void> {
  const classId = String(formData.get("classId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, class_id")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz || (quiz as { class_id: string }).class_id !== classId) {
    redirect(`/class/${classId}/quiz`);
  }

  const attemptId = await startAttemptOnQuiz(supabase, quizId, user.id);
  redirect(`/class/${classId}/quiz/${attemptId}`);
}
