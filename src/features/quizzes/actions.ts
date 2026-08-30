"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
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
  const courseId = String(formData.get("courseId") ?? "");

  const [user, ctx] = await Promise.all([getUser(), getCourseContext(courseId)]);
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
      .eq("course_id", courseId)
      .maybeSingle();
    if (!chapter) return { errors: { chapterId: "Chapitre inconnu pour cette classe." } };
  }

  const questionIds = await selectQuizQuestions(
    supabase,
    courseId,
    parsed.data.chapterId,
    parsed.data.count,
  );
  if (questionIds.length === 0) {
    return { formError: "Aucune question disponible pour ce choix. Ajoute des questions d'abord." };
  }

  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      course_id: courseId,
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

  revalidatePath(`/course/${courseId}/quiz`);
  redirect(`/course/${courseId}/quiz/${attemptId}`);
}

export async function submitQuizAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  let parsedResults: unknown;
  try {
    parsedResults = JSON.parse(String(formData.get("results") ?? "[]"));
  } catch {
    redirect(`/course/${courseId}/quiz/${attemptId}`);
  }

  const parsed = parseInput(submitQuizSchema, { results: parsedResults });
  if (!parsed.success) redirect(`/course/${courseId}/quiz/${attemptId}`);
  const results = parsed.success ? parsed.data.results : [];

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, user_id, completed_at, quizzes(course_id)")
    .eq("id", attemptId)
    .maybeSingle();

  const row = attempt as unknown as {
    user_id: string;
    completed_at: string | null;
    quizzes: { course_id: string } | null;
  } | null;

  if (!row || row.user_id !== user.id || row.quizzes?.course_id !== courseId) {
    redirect(`/course/${courseId}/quiz`);
  }
  if (row && row.completed_at) {
    redirect(`/course/${courseId}/quiz/${attemptId}`);
  }

  // Correction : les QCM / vrai-faux sont notés côté serveur d'après l'option
  // choisie ; les questions ouvertes d'après l'auto-évaluation déclarée.
  const optionIds = results
    .map((r) => r.selectedOptionId)
    .filter((id): id is string => Boolean(id));
  const correctOptions = new Set<string>();
  if (optionIds.length > 0) {
    const { data: opts } = await supabase
      .from("question_options")
      .select("id, is_correct")
      .in("id", optionIds);
    for (const o of (opts ?? []) as Array<{ id: string; is_correct: boolean }>) {
      if (o.is_correct) correctOptions.add(o.id);
    }
  }

  const graded = results.map((r) => {
    const isChoice = Boolean(r.selectedOptionId);
    const isCorrect = isChoice
      ? correctOptions.has(r.selectedOptionId as string)
      : r.knewIt === true;
    return {
      attempt_id: attemptId,
      quiz_question_id: r.quizQuestionId,
      knew_it: isChoice ? null : (r.knewIt ?? null),
      selected_option_id: r.selectedOptionId ?? null,
      is_correct: isCorrect,
    };
  });

  await supabase.from("quiz_answers").upsert(graded, { onConflict: "attempt_id,quiz_question_id" });

  const score = graded.filter((g) => g.is_correct).length;
  await supabase
    .from("quiz_attempts")
    .update({ score, total: graded.length, completed_at: new Date().toISOString() })
    .eq("id", attemptId);

  revalidatePath(`/course/${courseId}/quiz`);
  redirect(`/course/${courseId}/quiz/${attemptId}`);
}

export async function retakeQuizAction(formData: FormData): Promise<void> {
  const courseId = String(formData.get("courseId") ?? "");
  const quizId = String(formData.get("quizId") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, course_id")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz || (quiz as { course_id: string }).course_id !== courseId) {
    redirect(`/course/${courseId}/quiz`);
  }

  const attemptId = await startAttemptOnQuiz(supabase, quizId, user.id);
  redirect(`/course/${courseId}/quiz/${attemptId}`);
}
