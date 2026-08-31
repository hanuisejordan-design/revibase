import "server-only";

import type { createClient } from "@/lib/supabase/server";

type SB = Awaited<ReturnType<typeof createClient>>;

/**
 * Date d'entrée de l'utilisateur dans chaque cours, en millisecondes : le plus
 * tôt entre son adhésion directe (`course_members.joined_at`) et son adhésion à
 * la classe propriétaire (`class_members.joined_at`). Sert de **plancher** :
 * rien qui existait avant l'arrivée d'un membre ne compte comme « nouveau »
 * (sinon un nouvel arrivant croulerait sous des centaines de non-lus).
 */
export async function memberSinceByCourse(
  sb: SB,
  userId: string,
  courseIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (courseIds.length === 0) return out;

  const [{ data: cm }, { data: courses }] = await Promise.all([
    sb
      .from("course_members")
      .select("course_id, joined_at")
      .eq("user_id", userId)
      .in("course_id", courseIds),
    sb.from("courses").select("id, class_id").in("id", courseIds),
  ]);

  for (const r of (cm ?? []) as Array<{ course_id: string; joined_at: string }>) {
    out.set(r.course_id, new Date(r.joined_at).getTime());
  }

  const classOfCourse = new Map<string, string>();
  const classIds = new Set<string>();
  for (const c of (courses ?? []) as Array<{ id: string; class_id: string | null }>) {
    if (c.class_id) {
      classOfCourse.set(c.id, c.class_id);
      classIds.add(c.class_id);
    }
  }

  if (classIds.size > 0) {
    const { data: clm } = await sb
      .from("class_members")
      .select("class_id, joined_at")
      .eq("user_id", userId)
      .in("class_id", [...classIds]);

    const classJoined = new Map<string, number>();
    for (const r of (clm ?? []) as Array<{ class_id: string; joined_at: string }>) {
      classJoined.set(r.class_id, new Date(r.joined_at).getTime());
    }

    for (const courseId of courseIds) {
      const cid = classOfCourse.get(courseId);
      const viaClass = cid ? classJoined.get(cid) : undefined;
      if (viaClass !== undefined) {
        const cur = out.get(courseId);
        out.set(courseId, cur === undefined ? viaClass : Math.min(cur, viaClass));
      }
    }
  }

  return out;
}

/**
 * Sous-ensemble de `questionIds` que l'utilisateur a déjà ouvertes (table
 * `question_reads`). `null` si la table n'existe pas encore (migration 0021 non
 * appliquée) — l'appelant traite alors « aucune nouveauté ».
 */
export async function readQuestionIds(
  sb: SB,
  userId: string,
  questionIds: string[],
): Promise<Set<string> | null> {
  if (questionIds.length === 0) return new Set();
  const { data, error } = await sb
    .from("question_reads")
    .select("question_id")
    .eq("user_id", userId)
    .in("question_id", questionIds);
  if (error) return null;
  return new Set(((data ?? []) as Array<{ question_id: string }>).map((r) => r.question_id));
}

/** Idem pour les résumés (`summary_reads`). */
export async function readSummaryIds(
  sb: SB,
  userId: string,
  summaryIds: string[],
): Promise<Set<string> | null> {
  if (summaryIds.length === 0) return new Set();
  const { data, error } = await sb
    .from("summary_reads")
    .select("summary_id")
    .eq("user_id", userId)
    .in("summary_id", summaryIds);
  if (error) return null;
  return new Set(((data ?? []) as Array<{ summary_id: string }>).map((r) => r.summary_id));
}
