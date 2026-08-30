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
type ClassRow = {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  group_id: string | null;
};

/** Toutes les classes dont l'utilisateur courant est membre. */
export const getMyCourses = cache(async (): Promise<CourseSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  // La RLS laisse voir TOUS les membres de mes classes : on filtre sur moi.
  const { data: memberships, error } = await supabase
    .from("course_members")
    .select("role, course_id, classes(id, name, join_code, created_by, group_id)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) return [];

  const rows = memberships as unknown as Array<{
    role: CourseRole;
    course_id: string;
    classes: ClassRow | null;
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
    .filter((r): r is typeof r & { classes: ClassRow } => r.classes !== null)
    .map((r) => ({
      id: r.classes.id,
      name: r.classes.name,
      joinCode: r.classes.join_code,
      role: r.role,
      memberCount: counts.get(r.course_id) ?? 1,
      groupId: r.classes.group_id,
    }));
});

/**
 * Contexte de la classe demandée, ou `null` si l'utilisateur n'en est pas
 * membre (la RLS ne renvoie alors aucune ligne).
 */
export const getCourseContext = cache(async (courseId: string): Promise<CourseContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  // La visibilité est décidée par la RLS de `classes` : ligne `class_members`
  // OU membre du groupe propriétaire. Pas de ligne => pas d'accès => `null`.
  const { data: cls } = await supabase
    .from("courses")
    .select("id, name, join_code, created_by, group_id, groups(name)")
    .eq("id", courseId)
    .maybeSingle();

  if (!cls) return null;

  const row = cls as unknown as ClassRow & {
    groups: { name: string } | { name: string }[] | null;
  };
  const group = Array.isArray(row.groups) ? (row.groups[0] ?? null) : row.groups;

  const { data: membership } = await supabase
    .from("course_members")
    .select("role")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  const explicitRole = (membership as { role: CourseRole } | null)?.role ?? null;

  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    role: explicitRole ?? "student",
    isCreator: row.created_by === user.id,
    isExplicitMember: explicitRole !== null,
    groupId: row.group_id,
    groupName: group?.name ?? null,
  };
});

/** Membres de la classe, triés par date d'arrivée. */
export const getCourseMembers = cache(async (courseId: string): Promise<CourseMemberEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_members")
    .select("user_id, role, joined_at, profiles(display_name)")
    .eq("course_id", courseId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return (
    data as unknown as Array<{
      user_id: string;
      role: CourseRole;
      joined_at: string;
      profiles: { display_name: string } | null;
    }>
  ).map((m) => ({
    userId: m.user_id,
    displayName: m.profiles?.display_name ?? "Membre",
    role: m.role,
    joinedAt: m.joined_at,
  }));
});
