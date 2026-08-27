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
 * fourni). Les questions ayant au moins une réponse (donc une « réponse de
 * référence » possible) sont priorisées, puis on complète au hasard.
 */
export async function selectQuizQuestions(
  supabase: Supabase,
  classId: string,
  chapterId: string | null,
  count: number,
): Promise<string[]> {
  let query = supabase
    .from("questions")
    .select("id")
    .eq("class_id", classId)
    .is("deleted_at", null);

  if (chapterId) query = query.eq("chapter_id", chapterId);

  const { data: questions } = await query;
  const allIds = ((questions ?? []) as Array<{ id: string }>).map((q) => q.id);
  if (allIds.length === 0) return [];

  const { data: answered } = await supabase
    .from("answers")
    .select("question_id")
    .in("question_id", allIds);

  const answeredSet = new Set(
    ((answered ?? []) as Array<{ question_id: string }>).map((a) => a.question_id),
  );

  const withRef = shuffle(allIds.filter((id) => answeredSet.has(id)));
  const withoutRef = shuffle(allIds.filter((id) => !answeredSet.has(id)));

  return [...withRef, ...withoutRef].slice(0, count);
}
