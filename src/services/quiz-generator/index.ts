import "server-only";

import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Choisit jusqu'à `count` questions de la classe (filtrées par chapitre si
 * fourni). On priorise les questions « prêtes pour un quiz » : les QCM /
 * vrai-faux (corrigés automatiquement) et les questions ouvertes ayant au
 * moins une réponse de référence. On complète au hasard avec le reste.
 */
export async function selectQuizQuestions(
  supabase: Supabase,
  courseId: string,
  chapterId: string | null,
  count: number,
): Promise<string[]> {
  let query = supabase
    .from("questions")
    .select("id, kind")
    .eq("course_id", courseId)
    .is("deleted_at", null);

  if (chapterId) query = query.eq("chapter_id", chapterId);

  const { data: questions } = await query;
  const rows = (questions ?? []) as Array<{ id: string; kind: string }>;
  if (rows.length === 0) return [];

  const openIds = rows.filter((q) => q.kind === "open").map((q) => q.id);
  const { data: answered } = await supabase
    .from("answers")
    .select("question_id")
    .in("question_id", openIds.length > 0 ? openIds : ["00000000-0000-0000-0000-000000000000"]);
  const answeredSet = new Set(
    ((answered ?? []) as Array<{ question_id: string }>).map((a) => a.question_id),
  );

  const ready = shuffle(
    rows.filter((q) => q.kind !== "open" || answeredSet.has(q.id)).map((q) => q.id),
  );
  const rest = shuffle(
    rows.filter((q) => q.kind === "open" && !answeredSet.has(q.id)).map((q) => q.id),
  );

  return [...ready, ...rest].slice(0, count);
}
