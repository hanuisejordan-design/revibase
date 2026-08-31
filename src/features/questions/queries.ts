import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { QuestionKind, QuestionPurpose } from "@/constants/app";
import type { QuestionSort } from "./schema";
import type { QuestionDetail, QuestionListItem, QuestionOption, QuestionStatus } from "./types";

// `author:profiles!questions_author_id_fkey` : depuis la migration 0021
// (`question_reads`), `questions` a deux chemins vers `profiles` — on désambiguïse.
const QUESTION_SELECT =
  "id, title, body, kind, purpose, chapter_id, author_id, created_at, updated_at, image_path, chapters(name), author:profiles!questions_author_id_fkey(display_name)";

const IMAGE_BUCKET = "question-images";
const IMAGE_URL_TTL = 60 * 60; // 1 h

type QuestionRow = {
  id: string;
  title: string;
  body: string | null;
  kind: QuestionKind;
  purpose: QuestionPurpose;
  chapter_id: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  image_path: string | null;
  chapters: { name: string } | null;
  author: { display_name: string } | null;
};

/** URL signées (1 h) pour un lot de chemins d'images. */
async function signImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: Array<string | null>,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(unique, IMAGE_URL_TTL);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) map.set(item.path, item.signedUrl);
  }
  return map;
}

/** Compte réponses / commentaires et détecte une réponse validée, par question. */
export async function enrich(
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
  imageUrl: string | null,
): QuestionListItem {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    purpose: row.purpose,
    chapterId: row.chapter_id,
    chapterName: row.chapters?.name ?? null,
    authorName: row.author?.display_name ?? "Membre",
    createdAt: row.created_at,
    imageUrl,
    ...meta,
  };
}

export interface ListQuestionsOptions {
  chapter?: string; // id de chapitre, ou "none" pour « sans chapitre »
  search?: string;
  sort?: QuestionSort;
  purpose?: QuestionPurpose;
}

export const listQuestions = cache(
  async (courseId: string, opts: ListQuestionsOptions = {}): Promise<QuestionListItem[]> => {
    const supabase = await createClient();

    let query = supabase
      .from("questions")
      .select(QUESTION_SELECT)
      .eq("course_id", courseId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (opts.chapter === "none") query = query.is("chapter_id", null);
    else if (opts.chapter) query = query.eq("chapter_id", opts.chapter);

    if (opts.purpose) query = query.eq("purpose", opts.purpose);

    const search = opts.search?.trim();
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error || !data) return [];

    const rows = data as unknown as QuestionRow[];
    const [meta, images] = await Promise.all([
      enrich(
        supabase,
        rows.map((r) => r.id),
      ),
      signImages(
        supabase,
        rows.map((r) => r.image_path),
      ),
    ]);

    let items = rows.map((r) =>
      toListItem(
        r,
        meta.get(r.id) ?? { answerCount: 0, commentCount: 0, status: "unanswered" },
        r.image_path ? (images.get(r.image_path) ?? null) : null,
      ),
    );

    if (opts.sort === "unanswered") {
      items = items.filter((q) => q.kind === "open" && q.answerCount === 0);
    } else if (opts.sort === "popular") {
      items = [...items].sort((a, b) => b.answerCount - a.answerCount);
    }
    return items;
  },
);

export const getRecentQuestions = cache(
  async (courseId: string, limit = 5): Promise<QuestionListItem[]> => {
    const all = await listQuestions(courseId, { sort: "recent" });
    return all.slice(0, limit);
  },
);

export const getQuestion = cache(
  async (courseId: string, questionId: string): Promise<QuestionDetail | null> => {
    const user = await getUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("questions")
      .select(QUESTION_SELECT)
      .eq("id", questionId)
      .eq("course_id", courseId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as unknown as QuestionRow;
    const meta = (await enrich(supabase, [row.id])).get(row.id)!;
    const imageUrl = row.image_path
      ? ((await signImages(supabase, [row.image_path])).get(row.image_path) ?? null)
      : null;

    let options: QuestionOption[] = [];
    if (row.kind !== "open") {
      const { data: opts } = await supabase
        .from("question_options")
        .select("id, body, is_correct, position")
        .eq("question_id", row.id)
        .order("position", { ascending: true });
      options = (
        (opts ?? []) as Array<{ id: string; body: string; is_correct: boolean; position: number }>
      ).map((o) => ({ id: o.id, body: o.body, isCorrect: o.is_correct, position: o.position }));
    }

    return {
      id: row.id,
      title: row.title,
      body: row.body,
      kind: row.kind,
      purpose: row.purpose,
      options,
      chapterId: row.chapter_id,
      chapterName: row.chapters?.name ?? null,
      authorId: row.author_id,
      authorName: row.author?.display_name ?? "Membre",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      answerCount: meta.answerCount,
      commentCount: meta.commentCount,
      isAuthor: user?.id === row.author_id,
      imageUrl,
    };
  },
);
