import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { QuestionSort } from "./schema";
import type { QuestionDetail, QuestionListItem, QuestionStatus } from "./types";

type QuestionRow = {
  id: string;
  title: string;
  body: string | null;
  chapter_id: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  chapters: { name: string } | null;
  profiles: { display_name: string } | null;
};

/** Compte réponses / commentaires et détecte une réponse validée, par question. */
async function enrich(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionIds: string[],
): Promise<Map<string, { answerCount: number; commentCount: number; status: QuestionStatus }>> {
  const result = new Map<
    string,
    { answerCount: number; commentCount: number; status: QuestionStatus }
  >();
  for (const id of questionIds) {
    result.set(id, { answerCount: 0, commentCount: 0, status: "unanswered" });
  }
  if (questionIds.length === 0) return result;

  const [{ data: answers }, { data: comments }] = await Promise.all([
    supabase.from("answers").select("question_id, validated_by").in("question_id", questionIds),
    supabase.from("comments").select("question_id").in("question_id", questionIds),
  ]);

  for (const a of (answers ?? []) as Array<{ question_id: string; validated_by: string | null }>) {
    const entry = result.get(a.question_id);
    if (!entry) continue;
    entry.answerCount += 1;
    if (a.validated_by) entry.status = "validated";
    else if (entry.status !== "validated") entry.status = "answered";
  }
  for (const c of (comments ?? []) as Array<{ question_id: string }>) {
    const entry = result.get(c.question_id);
    if (entry) entry.commentCount += 1;
  }
  return result;
}

function toListItem(
  row: QuestionRow,
  meta: { answerCount: number; commentCount: number; status: QuestionStatus },
): QuestionListItem {
  return {
    id: row.id,
    title: row.title,
    chapterId: row.chapter_id,
    chapterName: row.chapters?.name ?? null,
    authorName: row.profiles?.display_name ?? "Membre",
    createdAt: row.created_at,
    ...meta,
  };
}

export interface ListQuestionsOptions {
  chapter?: string; // id de chapitre, ou "none" pour « sans chapitre »
  search?: string;
  sort?: QuestionSort;
}

export const listQuestions = cache(
  async (classId: string, opts: ListQuestionsOptions = {}): Promise<QuestionListItem[]> => {
    const supabase = await createClient();

    let query = supabase
      .from("questions")
      .select(
        "id, title, body, chapter_id, author_id, created_at, updated_at, chapters(name), profiles(display_name)",
      )
      .eq("class_id", classId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (opts.chapter === "none") query = query.is("chapter_id", null);
    else if (opts.chapter) query = query.eq("chapter_id", opts.chapter);

    const search = opts.search?.trim();
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error || !data) return [];

    const rows = data as unknown as QuestionRow[];
    const meta = await enrich(
      supabase,
      rows.map((r) => r.id),
    );

    let items = rows.map((r) =>
      toListItem(r, meta.get(r.id) ?? { answerCount: 0, commentCount: 0, status: "unanswered" }),
    );

    if (opts.sort === "unanswered") {
      items = items.filter((q) => q.answerCount === 0);
    } else if (opts.sort === "popular") {
      items = [...items].sort((a, b) => b.answerCount - a.answerCount);
    }
    return items;
  },
);

export const getRecentQuestions = cache(
  async (classId: string, limit = 5): Promise<QuestionListItem[]> => {
    const all = await listQuestions(classId, { sort: "recent" });
    return all.slice(0, limit);
  },
);

export const getQuestion = cache(
  async (classId: string, questionId: string): Promise<QuestionDetail | null> => {
    const user = await getUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, title, body, chapter_id, author_id, created_at, updated_at, chapters(name), profiles(display_name)",
      )
      .eq("id", questionId)
      .eq("class_id", classId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as unknown as QuestionRow;
    const meta = (await enrich(supabase, [row.id])).get(row.id)!;

    return {
      id: row.id,
      title: row.title,
      body: row.body,
      chapterId: row.chapter_id,
      chapterName: row.chapters?.name ?? null,
      authorId: row.author_id,
      authorName: row.profiles?.display_name ?? "Membre",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      answerCount: meta.answerCount,
      commentCount: meta.commentCount,
      isAuthor: user?.id === row.author_id,
    };
  },
);
