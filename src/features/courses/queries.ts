import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { CourseRole } from "@/constants/app";
import type { CourseContext, CourseMemberEntry, CourseSummary } from "./types";

/**
 * Sans types générés depuis Supabase, les lignes renvoyées sont peu typées.
 * On les projette dans des interfaces locales explicites.
 */
type CourseRow = {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  class_id: string | null;
};

/** Tous les cours dont l'utilisateur courant est membre (adhésion explicite). */
export const getMyCourses = cache(async (): Promise<CourseSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  // La RLS laisse voir TOUS les membres de mes cours : on filtre sur moi.
  const { data: memberships, error } = await supabase
    .from("course_members")
    .select("role, is_admin, course_id, courses(id, name, join_code, created_by, class_id)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) return [];

  const rows = memberships as unknown as Array<{
    role: CourseRole;
    is_admin: boolean;
    course_id: string;
    courses: CourseRow | null;
  }>;

  const courseIds = rows.map((r) => r.course_id);

  const { data: allMembers } = await supabase
    .from("course_members")
    .select("course_id")
    .in("course_id", courseIds);

  const counts = new Map<string, number>();
  for (const m of (allMembers ?? []) as Array<{ course_id: string }>) {
    counts.set(m.course_id, (counts.get(m.course_id) ?? 0) + 1);
  }

  return rows
    .filter((r): r is typeof r & { courses: CourseRow } => r.courses !== null)
    .map((r) => ({
      id: r.courses.id,
      name: r.courses.name,
      joinCode: r.courses.join_code,
      role: r.role,
      isAdmin: r.is_admin,
      memberCount: counts.get(r.course_id) ?? 1,
      classId: r.courses.class_id,
    }));
});

/**
 * Contexte du cours demandé, ou `null` si l'utilisateur n'y a pas accès (la
 * RLS ne renvoie alors aucune ligne).
 */
export const getCourseContext = cache(async (courseId: string): Promise<CourseContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  // La visibilité est décidée par la RLS de `courses` : ligne `course_members`
  // OU membre de la classe propriétaire. Pas de ligne => pas d'accès => `null`.
  const { data: course } = await supabase
    .from("courses")
    .select("id, name, join_code, created_by, class_id, classes(name)")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return null;

  const row = course as unknown as CourseRow & {
    classes: { name: string } | { name: string }[] | null;
  };
  const parentClass = Array.isArray(row.classes) ? (row.classes[0] ?? null) : row.classes;

  const { data: membership } = await supabase
    .from("course_members")
    .select("role, is_admin")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  const m = membership as { role: CourseRole; is_admin: boolean } | null;

  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    role: m?.role ?? "student",
    isCreator: row.created_by === user.id,
    isAdmin: m?.is_admin ?? false,
    isExplicitMember: m !== null,
    classId: row.class_id,
    classLabel: parentClass?.name ?? null,
  };
});

/** Membres du cours, triés par date d'arrivée. */
export const getCourseMembers = cache(async (courseId: string): Promise<CourseMemberEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_members")
    .select("user_id, role, is_admin, joined_at, profiles(display_name)")
    .eq("course_id", courseId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return (
    data as unknown as Array<{
      user_id: string;
      role: CourseRole;
      is_admin: boolean;
      joined_at: string;
      profiles: { display_name: string } | null;
    }>
  ).map((m) => ({
    userId: m.user_id,
    displayName: m.profiles?.display_name ?? "Membre",
    role: m.role,
    isAdmin: m.is_admin,
    joinedAt: m.joined_at,
  }));
});
