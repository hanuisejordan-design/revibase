import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { getCourseContext } from "@/features/courses/queries";
import type { SummaryItem } from "./types";

const BUCKET = "summaries";
const URL_TTL = 60 * 60; // 1 h

type SummaryRow = {
  id: string;
  title: string;
  chapter_id: string | null;
  author_id: string;
  created_at: string;
  file_path: string;
  file_name: string;
  chapters: { name: string } | null;
  author: { display_name: string } | null;
};

export function kindOf(fileName: string): SummaryItem["kind"] {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif", "avif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

/** URL signées (1 h) pour un lot de chemins de fichiers du bucket `summaries`. */
export async function signSummaryFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(paths)];
  if (unique.length === 0) return map;

  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, URL_TTL);
  for (const s of data ?? []) {
    if (s.path && s.signedUrl && !s.error) map.set(s.path, s.signedUrl);
  }
  return map;
}

/** Résumés d'un cours, du plus récent au plus ancien. */
export const listSummaries = cache(async (courseId: string): Promise<SummaryItem[]> => {
  const [user, ctx, supabase] = await Promise.all([
    getUser(),
    getCourseContext(courseId),
    createClient(),
  ]);
  if (!user || !ctx) return [];

  const { data, error } = await supabase
    .from("summaries")
    .select(
      "id, title, chapter_id, author_id, created_at, file_path, file_name, chapters(name), author:profiles!summaries_author_id_fkey(display_name)",
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  const rows = data as unknown as SummaryRow[];
  const ids = rows.map((r) => r.id);

  const [{ data: signed }, { data: pins }] = await Promise.all([
    supabase.storage.from(BUCKET).createSignedUrls(
      rows.map((r) => r.file_path),
      URL_TTL,
    ),
    supabase.from("summary_pins").select("summary_id").eq("user_id", user.id).in("summary_id", ids),
  ]);

  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl && !s.error) urlByPath.set(s.path, s.signedUrl);
  }
  const pinnedIds = new Set(
    ((pins ?? []) as Array<{ summary_id: string }>).map((p) => p.summary_id),
  );

  const isTrainer = ctx.role === "trainer";

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    chapterId: r.chapter_id,
    chapterName: r.chapters?.name ?? null,
    authorId: r.author_id,
    authorName: r.author?.display_name ?? "Membre",
    createdAt: r.created_at,
    fileName: r.file_name,
    fileUrl: urlByPath.get(r.file_path) ?? null,
    canDelete: r.author_id === user.id || isTrainer,
    pinned: pinnedIds.has(r.id),
    kind: kindOf(r.file_name),
  }));
});
