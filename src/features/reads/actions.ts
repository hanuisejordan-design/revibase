"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import {
  getClassNewQuestions,
  getClassNewSummaries,
  getMyNewQuestions,
  getMyNewSummaries,
} from "@/features/classes/queries";

/**
 * Marque UNE question comme lue pour l'utilisateur courant. Appelé au montage
 * de la page détail : l'ouvrir = l'avoir vue. Silencieux (best-effort).
 */
export async function markQuestionReadAction(questionId: string): Promise<void> {
  if (!questionId) return;
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("question_reads")
    .upsert(
      { question_id: questionId, user_id: user.id, seen_at: new Date().toISOString() },
      { onConflict: "question_id,user_id", ignoreDuplicates: true },
    );

  revalidatePath("/dashboard");
}

/** Idem pour un résumé : appelé quand on ouvre le fichier. */
export async function markSummaryReadAction(summaryId: string): Promise<void> {
  if (!summaryId) return;
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("summary_reads")
    .upsert(
      { summary_id: summaryId, user_id: user.id, seen_at: new Date().toISOString() },
      { onConflict: "summary_id,user_id", ignoreDuplicates: true },
    );

  revalidatePath("/dashboard");
}

/** « Tout marquer comme lu » — questions de tous les cours d'une classe. */
export async function markAllClassQuestionsReadAction(classId: string): Promise<void> {
  if (!classId) return;
  const user = await getUser();
  if (!user) return;

  const items = await getClassNewQuestions(classId);
  if (items.length === 0) return;

  const supabase = await createClient();
  await supabase.from("question_reads").upsert(
    items.map((q) => ({
      question_id: q.id,
      user_id: user.id,
      seen_at: new Date().toISOString(),
    })),
    { onConflict: "question_id,user_id", ignoreDuplicates: true },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/class/${classId}`);
  revalidatePath(`/class/${classId}/nouvelles`);
}

/** « Tout marquer comme lu » — résumés de tous les cours d'une classe. */
export async function markAllClassSummariesReadAction(classId: string): Promise<void> {
  if (!classId) return;
  const user = await getUser();
  if (!user) return;

  const items = await getClassNewSummaries(classId);
  if (items.length === 0) return;

  const supabase = await createClient();
  await supabase.from("summary_reads").upsert(
    items.map((s) => ({
      summary_id: s.id,
      user_id: user.id,
      seen_at: new Date().toISOString(),
    })),
    { onConflict: "summary_id,user_id", ignoreDuplicates: true },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/class/${classId}`);
  revalidatePath(`/class/${classId}/nouveaux-resumes`);
}

/** « Tout marquer comme lu » — toutes mes nouvelles questions (page /nouvelles). */
export async function markAllMyQuestionsReadAction(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const items = await getMyNewQuestions();
  if (items.length === 0) return;

  const supabase = await createClient();
  await supabase.from("question_reads").upsert(
    items.map((q) => ({ question_id: q.id, user_id: user.id, seen_at: new Date().toISOString() })),
    { onConflict: "question_id,user_id", ignoreDuplicates: true },
  );

  revalidatePath("/dashboard");
  revalidatePath("/nouvelles");
}

/** « Tout marquer comme lu » — tous mes nouveaux résumés. */
export async function markAllMySummariesReadAction(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const items = await getMyNewSummaries();
  if (items.length === 0) return;

  const supabase = await createClient();
  await supabase.from("summary_reads").upsert(
    items.map((s) => ({ summary_id: s.id, user_id: user.id, seen_at: new Date().toISOString() })),
    { onConflict: "summary_id,user_id", ignoreDuplicates: true },
  );

  revalidatePath("/dashboard");
  revalidatePath("/nouvelles");
}
