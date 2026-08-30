import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { CourseRole } from "@/constants/app";
import type { CourseSummary } from "@/features/courses/types";
import type { GroupContext, GroupMemberEntry, GroupSummary } from "./types";

type GroupRow = { id: string; name: string; join_code: string };
type GroupClassRow = {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  group_id: string;
};

/** Compte les membres explicites et repère le rôle de l'utilisateur courant. */
async function classMemberInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseIds: string[],
  userId: string,
): Promise<{ counts: Map<string, number>; myRole: Map<string, CourseRole> }> {
  const counts = new Map<string, number>();
  const myRole = new Map<string, CourseRole>();
  if (courseIds.length === 0) return { counts, myRole };

  const { data } = await supabase
    .from("course_members")
    .select("course_id, user_id, role")
    .in("course_id", courseIds);

  for (const m of (data ?? []) as Array<{ course_id: string; user_id: string; role: CourseRole }>) {
    counts.set(m.course_id, (counts.get(m.course_id) ?? 0) + 1);
    if (m.user_id === userId) myRole.set(m.course_id, m.role);
  }
  return { counts, myRole };
}

function toCourseSummary(
  c: GroupClassRow,
  counts: Map<string, number>,
  myRole: Map<string, CourseRole>,
): CourseSummary {
  return {
    id: c.id,
    name: c.name,
    joinCode: c.join_code,
    role: myRole.get(c.id) ?? "student",
    memberCount: counts.get(c.id) ?? 0,
    groupId: c.group_id,
  };
}

/** Tous les groupes dont l'utilisateur est membre, avec leurs classes. */
export const getMyGroups = cache(async (): Promise<GroupSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("group_members")
    .select("group_id, is_admin, groups(id, name, join_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) return [];

  const rows = memberships as unknown as Array<{
    group_id: string;
    is_admin: boolean;
    groups: GroupRow | null;
  }>;

  const groupIds = rows.map((r) => r.group_id);

  const { data: classesData } = await supabase
    .from("courses")
    .select("id, name, join_code, created_by, group_id")
    .in("group_id", groupIds)
    .order("created_at", { ascending: true });

  const classes = (classesData ?? []) as GroupClassRow[];
  const { counts, myRole } = await classMemberInfo(
    supabase,
    classes.map((c) => c.id),
    user.id,
  );

  return rows
    .filter((r): r is typeof r & { groups: GroupRow } => r.groups !== null)
    .map((r) => ({
      id: r.groups.id,
      name: r.groups.name,
      joinCode: r.groups.join_code,
      isAdmin: r.is_admin,
      classes: classes
        .filter((c) => c.group_id === r.group_id)
        .map((c) => toCourseSummary(c, counts, myRole)),
    }));
});

/** Contexte du groupe, ou `null` si l'utilisateur n'en est pas membre. */
export const getGroupContext = cache(async (groupId: string): Promise<GroupContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("group_members")
    .select("is_admin")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: grp } = await supabase
    .from("groups")
    .select("id, name, join_code")
    .eq("id", groupId)
    .maybeSingle();

  if (!grp) return null;

  const g = grp as GroupRow;
  return {
    id: g.id,
    name: g.name,
    joinCode: g.join_code,
    isAdmin: (membership as { is_admin: boolean }).is_admin,
  };
});

/** Classes d'un groupe (pour la page du groupe). */
export const getGroupClasses = cache(async (groupId: string): Promise<CourseSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("courses")
    .select("id, name, join_code, created_by, group_id")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  const classes = (data ?? []) as GroupClassRow[];
  const { counts, myRole } = await classMemberInfo(
    supabase,
    classes.map((c) => c.id),
    user.id,
  );

  return classes.map((c) => toCourseSummary(c, counts, myRole));
});

/** Membres du groupe, triés par date d'arrivée. */
export const getGroupMembers = cache(async (groupId: string): Promise<GroupMemberEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, is_admin, joined_at, profiles(display_name)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return (
    data as unknown as Array<{
      user_id: string;
      is_admin: boolean;
      joined_at: string;
      profiles: { display_name: string } | null;
    }>
  ).map((m) => ({
    userId: m.user_id,
    displayName: m.profiles?.display_name ?? "Membre",
    isAdmin: m.is_admin,
    joinedAt: m.joined_at,
  }));
});
