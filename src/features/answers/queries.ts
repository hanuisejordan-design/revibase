import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { AnswerItem } from "./types";

type AnswerRow = {
  id: string;
  body: string;
  author_id: string;
  accepted: boolean;
  validated_by: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
};

/** Réponses d'une question, triées : validée > retenue > votes > ancienneté. */
export const listAnswers = cache(async (questionId: string): Promise<AnswerItem[]> => {
  const supabase = await createClient();
  const user = await getUser();

  const { data, error } = await supabase
    .from("answers")
    .select("id, body, author_id, accepted, validated_by, created_at, profiles(display_name)")
    .eq("question_id", questionId);

  if (error || !data || data.length === 0) return [];

  const rows = data as unknown as AnswerRow[];
  const ids = rows.map((r) => r.id);

  const { data: votes } = await supabase
    .from("answer_votes")
    .select("answer_id, user_id")
    .in("answer_id", ids);

  const voteCount = new Map<string, number>();
  const viewerVoted = new Set<string>();
  for (const v of (votes ?? []) as Array<{ answer_id: string; user_id: string }>) {
    voteCount.set(v.answer_id, (voteCount.get(v.answer_id) ?? 0) + 1);
    if (user && v.user_id === user.id) viewerVoted.add(v.answer_id);
  }

  let topId: string | null = null;
  let topCount = 0;
  for (const [id, count] of voteCount) {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  }

  const items: AnswerItem[] = rows.map((r) => ({
    id: r.id,
    body: r.body,
    authorId: r.author_id,
    authorName: r.profiles?.display_name ?? "Membre",
    createdAt: r.created_at,
    voteCount: voteCount.get(r.id) ?? 0,
    viewerHasVoted: viewerVoted.has(r.id),
    accepted: r.accepted,
    validated: r.validated_by !== null,
    isTopVoted: r.id === topId && topCount > 0,
  }));

  const rank = (a: AnswerItem) => (a.validated ? 0 : a.accepted ? 1 : 2);
  items.sort(
    (a, b) =>
      rank(a) - rank(b) || b.voteCount - a.voteCount || a.createdAt.localeCompare(b.createdAt),
  );

  return items;
});
