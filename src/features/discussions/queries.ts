import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CommentItem } from "./types";

type CommentRow = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

/** Fil de discussion d'une question, du plus ancien au plus récent. */
export const listComments = cache(async (questionId: string): Promise<CommentItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, body, author_id, created_at, profiles(display_name)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as CommentRow[]).map((row) => ({
    id: row.id,
    body: row.body,
    authorId: row.author_id,
    authorName: row.profiles?.display_name ?? "Membre",
    createdAt: row.created_at,
  }));
});
