import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { ClassRole } from "@/constants/app";
import type { ClassContext, ClassMemberEntry, ClassSummary } from "./types";

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
export const getMyClasses = cache(async (): Promise<ClassSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  // La RLS laisse voir TOUS les membres de mes classes : on filtre sur moi.
  const { data: memberships, error } = await supabase
    .from("class_members")
    .select("role, class_id, classes(id, name, join_code, created_by, group_id)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) return [];

  const rows = memberships as unknown as Array<{
    role: ClassRole;
    class_id: string;
    classes: ClassRow | null;
  }>;

  const classIds = rows.map((r) => r.class_id);

  const { data: allMembers } = await supabase
    .from("class_members")
    .select("class_id")
    .in("class_id", classIds);

  const counts = new Map<string, number>();
  for (const m of (allMembers ?? []) as Array<{ class_id: string }>) {
    counts.set(m.class_id, (counts.get(m.class_id) ?? 0) + 1);
  }

  return rows
    .filter((r): r is typeof r & { classes: ClassRow } => r.classes !== null)
    .map((r) => ({
      id: r.classes.id,
      name: r.classes.name,
      joinCode: r.classes.join_code,
      role: r.role,
      memberCount: counts.get(r.class_id) ?? 1,
      groupId: r.classes.group_id,
    }));
});

/**
 * Contexte de la classe demandée, ou `null` si l'utilisateur n'en est pas
 * membre (la RLS ne renvoie alors aucune ligne).
 */
export const getClassContext = cache(async (classId: string): Promise<ClassContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  // La visibilité est décidée par la RLS de `classes` : ligne `class_members`
  // OU membre du groupe propriétaire. Pas de ligne => pas d'accès => `null`.
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, join_code, created_by, group_id, groups(name)")
    .eq("id", classId)
    .maybeSingle();

  if (!cls) return null;

  const row = cls as unknown as ClassRow & {
    groups: { name: string } | { name: string }[] | null;
  };
  const group = Array.isArray(row.groups) ? (row.groups[0] ?? null) : row.groups;

  const { data: membership } = await supabase
    .from("class_members")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .maybeSingle();

  const explicitRole = (membership as { role: ClassRole } | null)?.role ?? null;

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
export const getClassMembers = cache(async (classId: string): Promise<ClassMemberEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("class_members")
    .select("user_id, role, joined_at, profiles(display_name)")
    .eq("class_id", classId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return (
    data as unknown as Array<{
      user_id: string;
      role: ClassRole;
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
