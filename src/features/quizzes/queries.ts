import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { QuestionKind } from "@/constants/app";
import type {
  AttemptSummary,
  QuizOption,
  QuizQuestionCard,
  QuizResult,
  QuizRunnerData,
  ReferenceKind,
} from "./types";

type AttemptRow = {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  total: number | null;
  started_at: string;
  completed_at: string | null;
  quizzes: { class_id: string; chapter_id: string | null } | null;
};

async function loadAttempt(attemptId: string): Promise<AttemptRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select(
      "id, quiz_id, user_id, score, total, started_at, completed_at, quizzes(class_id, chapter_id)",
    )
    .eq("id", attemptId)
    .maybeSingle();
  return (data as unknown as AttemptRow | null) ?? null;
}

/** Réponse de référence par question : validée > retenue > la plus votée. */
async function referenceAnswers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionIds: string[],
): Promise<Map<string, { text: string; kind: ReferenceKind }>> {
  const out = new Map<string, { text: string; kind: ReferenceKind }>();
  if (questionIds.length === 0) return out;

  const { data: answers } = await supabase
    .from("answers")
    .select("id, question_id, body, accepted, validated_by")
    .in("question_id", questionIds);

  const rows = (answers ?? []) as Array<{
    id: string;
    question_id: string;
    body: string;
    accepted: boolean;
    validated_by: string | null;
  }>;

  const { data: votes } = await supabase
    .from("answer_votes")
    .select("answer_id")
    .in(
      "answer_id",
      rows.map((r) => r.id),
    );
  const voteCount = new Map<string, number>();
  for (const v of (votes ?? []) as Array<{ answer_id: string }>) {
    voteCount.set(v.answer_id, (voteCount.get(v.answer_id) ?? 0) + 1);
  }

  const byQuestion = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byQuestion.get(r.question_id) ?? [];
    list.push(r);
    byQuestion.set(r.question_id, list);
  }

  for (const [questionId, list] of byQuestion) {
    const validated = list.find((a) => a.validated_by);
    const accepted = list.find((a) => a.accepted);
    const topVoted = [...list].sort(
      (a, b) => (voteCount.get(b.id) ?? 0) - (voteCount.get(a.id) ?? 0),
    )[0];

    if (validated) out.set(questionId, { text: validated.body, kind: "validated" });
    else if (accepted) out.set(questionId, { text: accepted.body, kind: "accepted" });
    else if (topVoted && (voteCount.get(topVoted.id) ?? 0) > 0)
      out.set(questionId, { text: topVoted.body, kind: "community" });
    else if (topVoted) out.set(questionId, { text: topVoted.body, kind: null });
  }
  return out;
}

/** Données pour passer un quiz (tentative non terminée). */
export const getRunnerData = cache(
  async (classId: string, attemptId: string): Promise<QuizRunnerData | null> => {
    const [user, attempt] = await Promise.all([getUser(), loadAttempt(attemptId)]);
    if (!user || !attempt || attempt.user_id !== user.id) return null;
    if (attempt.quizzes?.class_id !== classId) return null;
    if (attempt.completed_at) return null;

    const supabase = await createClient();
    const { data: qqs } = await supabase
      .from("quiz_questions")
      .select("id, position, question_id, questions(title, body, kind, image_path, chapters(name))")
      .eq("quiz_id", attempt.quiz_id)
      .order("position", { ascending: true });

    const rows = (qqs ?? []) as unknown as Array<{
      id: string;
      position: number;
      question_id: string;
      questions: {
        title: string;
        body: string | null;
        kind: QuestionKind;
        image_path: string | null;
        chapters: { name: string } | null;
      } | null;
    }>;

    const openIds = rows.filter((r) => r.questions?.kind === "open").map((r) => r.question_id);
    const choiceIds = rows.filter((r) => r.questions?.kind !== "open").map((r) => r.question_id);

    const imagePaths = [
      ...new Set(
        rows.map((r) => r.questions?.image_path).filter((p): p is string => Boolean(p)),
      ),
    ];
    const imageUrls = new Map<string, string>();

    const [refs, optionsByQuestion, signed] = await Promise.all([
      referenceAnswers(supabase, openIds),
      loadOptions(supabase, choiceIds),
      imagePaths.length > 0
        ? supabase.storage.from("question-images").createSignedUrls(imagePaths, 60 * 60)
        : Promise.resolve({ data: [] as Array<{ path?: string; signedUrl?: string; error?: unknown }> }),
    ]);
    for (const item of signed.data ?? []) {
      if (item.path && item.signedUrl && !item.error) imageUrls.set(item.path, item.signedUrl);
    }

    const questions: QuizQuestionCard[] = rows.map((r) => {
      const kind = r.questions?.kind ?? "open";
      const imgPath = r.questions?.image_path ?? null;
      return {
        quizQuestionId: r.id,
        questionId: r.question_id,
        position: r.position,
        kind,
        title: r.questions?.title ?? "Question supprimée",
        body: r.questions?.body ?? null,
        chapterName: r.questions?.chapters?.name ?? null,
        imageUrl: imgPath ? (imageUrls.get(imgPath) ?? null) : null,
        referenceAnswer: kind === "open" ? (refs.get(r.question_id)?.text ?? null) : null,
        referenceKind: kind === "open" ? (refs.get(r.question_id)?.kind ?? null) : null,
        options: kind === "open" ? [] : (optionsByQuestion.get(r.question_id) ?? []),
      };
    });

    return { attemptId, questions };
  },
);

async function loadOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionIds: string[],
): Promise<Map<string, QuizOption[]>> {
  const out = new Map<string, QuizOption[]>();
  if (questionIds.length === 0) return out;

  const { data } = await supabase
    .from("question_options")
    .select("id, question_id, body, is_correct, position")
    .in("question_id", questionIds)
    .order("position", { ascending: true });

  for (const o of (data ?? []) as Array<{
    id: string;
    question_id: string;
    body: string;
    is_correct: boolean;
  }>) {
    const list = out.get(o.question_id) ?? [];
    list.push({ id: o.id, body: o.body, isCorrect: o.is_correct });
    out.set(o.question_id, list);
  }
  return out;
}

/** Résultat d'une tentative terminée. */
export const getResult = cache(
  async (classId: string, attemptId: string): Promise<QuizResult | null> => {
    const [user, attempt] = await Promise.all([getUser(), loadAttempt(attemptId)]);
    if (!user || !attempt || attempt.user_id !== user.id) return null;
    if (attempt.quizzes?.class_id !== classId || !attempt.completed_at) return null;

    const supabase = await createClient();
    const { data: wrong } = await supabase
      .from("quiz_answers")
      .select("quiz_questions(question_id, questions(title))")
      .eq("attempt_id", attemptId)
      .eq("is_correct", false);

    const toReview = (
      (wrong ?? []) as unknown as Array<{
        quiz_questions: { question_id: string; questions: { title: string } | null } | null;
      }>
    )
      .map((w) => ({
        questionId: w.quiz_questions?.question_id ?? "",
        title: w.quiz_questions?.questions?.title ?? "Question",
      }))
      .filter((q) => q.questionId);

    let chapterLabel = "Tous les chapitres";
    if (attempt.quizzes?.chapter_id) {
      const { data: chapter } = await supabase
        .from("chapters")
        .select("name")
        .eq("id", attempt.quizzes.chapter_id)
        .maybeSingle();
      chapterLabel = (chapter as { name: string } | null)?.name ?? chapterLabel;
    }

    const score = attempt.score ?? 0;
    const total = attempt.total ?? 0;
    return {
      attemptId,
      quizId: attempt.quiz_id,
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
      chapterLabel,
      toReview,
    };
  },
);

/** Tentatives récentes de l'utilisateur dans cette classe. */
export const listMyAttempts = cache(async (classId: string): Promise<AttemptSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("id, score, total, started_at, completed_at, quizzes!inner(class_id, chapter_id)")
    .eq("user_id", user.id)
    .eq("quizzes.class_id", classId)
    .order("started_at", { ascending: false })
    .limit(10);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    score: number | null;
    total: number | null;
    started_at: string;
    completed_at: string | null;
    quizzes: { chapter_id: string | null } | null;
  }>;

  const chapterIds = [
    ...new Set(rows.map((r) => r.quizzes?.chapter_id).filter((id): id is string => Boolean(id))),
  ];
  const chapterName = new Map<string, string>();
  if (chapterIds.length > 0) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id, name")
      .in("id", chapterIds);
    for (const c of (chapters ?? []) as Array<{ id: string; name: string }>) {
      chapterName.set(c.id, c.name);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    score: r.score,
    total: r.total,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    chapterLabel: r.quizzes?.chapter_id
      ? (chapterName.get(r.quizzes.chapter_id) ?? "Chapitre")
      : "Tous les chapitres",
  }));
});
