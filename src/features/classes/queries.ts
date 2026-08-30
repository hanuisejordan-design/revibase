import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { CourseRole } from "@/constants/app";
import { countCourseContent } from "@/features/courses/queries";
import type { CourseSummary } from "@/features/courses/types";
import type { ClassContext, ClassMemberEntry, ClassSummary } from "./types";

type ContentCounts = { questions: Map<string, number>; summaries: Map<string, number> };

type ClassRow = { id: string; name: string; join_code: string };
type CourseRow = {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  class_id: string;
};

/** Compte les membres explicites et repère le rôle / admin de l'utilisateur. */
async function courseMemberInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseIds: string[],
  userId: string,
): Promise<{
  counts: Map<string, number>;
  myRole: Map<string, CourseRole>;
  myAdmin: Set<string>;
}> {
  const counts = new Map<string, number>();
  const myRole = new Map<string, CourseRole>();
  const myAdmin = new Set<string>();
  if (courseIds.length === 0) return { counts, myRole, myAdmin };

  const { data } = await supabase
    .from("course_members")
    .select("course_id, user_id, role, is_admin")
    .in("course_id", courseIds);

  for (const m of (data ?? []) as Array<{
    course_id: string;
    user_id: string;
    role: CourseRole;
    is_admin: boolean;
  }>) {
    counts.set(m.course_id, (counts.get(m.course_id) ?? 0) + 1);
    if (m.user_id === userId) {
      myRole.set(m.course_id, m.role);
      if (m.is_admin) myAdmin.add(m.course_id);
    }
  }
  return { counts, myRole, myAdmin };
}

function toCourseSummary(
  c: CourseRow,
  counts: Map<string, number>,
  myRole: Map<string, CourseRole>,
  myAdmin: Set<string>,
  content: ContentCounts,
): CourseSummary {
  return {
    id: c.id,
    name: c.name,
    joinCode: c.join_code,
    role: myRole.get(c.id) ?? "student",
    isAdmin: myAdmin.has(c.id),
    memberCount: counts.get(c.id) ?? 0,
    questionCount: content.questions.get(c.id) ?? 0,
    summaryCount: content.summaries.get(c.id) ?? 0,
    classId: c.class_id,
  };
}

/** Toutes les classes (promos) dont l'utilisateur est membre, avec leurs cours. */
export const getMyClasses = cache(async (): Promise<ClassSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("class_members")
    .select("class_id, is_admin, classes(id, name, join_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) return [];

  const rows = memberships as unknown as Array<{
    class_id: string;
    is_admin: boolean;
    classes: ClassRow | null;
  }>;

  const classIds = rows.map((r) => r.class_id);

  const [{ data: coursesData }, { data: allClassMembers }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, join_code, created_by, class_id")
      .in("class_id", classIds)
      .order("created_at", { ascending: true }),
    supabase.from("class_members").select("class_id").in("class_id", classIds),
  ]);

  const courses = (coursesData ?? []) as CourseRow[];
  const courseIds = courses.map((c) => c.id);
  const [{ counts, myRole, myAdmin }, content] = await Promise.all([
    courseMemberInfo(supabase, courseIds, user.id),
    countCourseContent(supabase, courseIds),
  ]);

  const memberCount = new Map<string, number>();
  for (const m of (allClassMembers ?? []) as Array<{ class_id: string }>) {
    memberCount.set(m.class_id, (memberCount.get(m.class_id) ?? 0) + 1);
  }

  return rows
    .filter((r): r is typeof r & { classes: ClassRow } => r.classes !== null)
    .map((r) => ({
      id: r.classes.id,
      name: r.classes.name,
      joinCode: r.classes.join_code,
      isAdmin: r.is_admin,
      memberCount: memberCount.get(r.class_id) ?? 1,
      courses: courses
        .filter((c) => c.class_id === r.class_id)
        .map((c) => toCourseSummary(c, counts, myRole, myAdmin, content)),
    }));
});

/** Contexte de la classe, ou `null` si l'utilisateur n'en est pas membre. */
export const getClassContext = cache(async (classId: string): Promise<ClassContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("class_members")
    .select("is_admin")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, join_code")
    .eq("id", classId)
    .maybeSingle();

  if (!cls) return null;

  const row = cls as ClassRow;
  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    isAdmin: (membership as { is_admin: boolean }).is_admin,
  };
});

/** Cours d'une classe (pour la page de la classe). */
export const getClassCourses = cache(async (classId: string): Promise<CourseSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("courses")
    .select("id, name, join_code, created_by, class_id")
    .eq("class_id", classId)
    .order("created_at", { ascending: true });

  const courses = (data ?? []) as CourseRow[];
  const courseIds = courses.map((c) => c.id);
  const [{ counts, myRole, myAdmin }, content] = await Promise.all([
    courseMemberInfo(supabase, courseIds, user.id),
    countCourseContent(supabase, courseIds),
  ]);

  return courses.map((c) => toCourseSummary(c, counts, myRole, myAdmin, content));
});

/** Membres de la classe, triés par date d'arrivée. */
export const getClassMembers = cache(async (classId: string): Promise<ClassMemberEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("class_members")
    .select("user_id, is_admin, joined_at, profiles(display_name)")
    .eq("class_id", classId)
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
