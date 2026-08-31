import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { CourseRole } from "@/constants/app";
import type { QuestionKind } from "@/constants/app";
import {
  countCourseContent,
  countNewQuestions,
  countNewSummaries,
} from "@/features/courses/queries";
import { enrich } from "@/features/questions/queries";
import { kindOf, signSummaryFiles } from "@/features/summaries/queries";
import type { CourseSummary } from "@/features/courses/types";
import type { QuestionStatus } from "@/features/questions/types";
import type {
  ClassContext,
  ClassMemberEntry,
  ClassNewQuestion,
  ClassNewSummary,
  ClassSummary,
} from "./types";

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
  newQuestions: Map<string, number>,
  newSummaries: Map<string, number>,
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
    newQuestionCount: newQuestions.get(c.id) ?? 0,
    newSummaryCount: newSummaries.get(c.id) ?? 0,
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
  const [{ counts, myRole, myAdmin }, content, newQuestions, newSummaries] = await Promise.all([
    courseMemberInfo(supabase, courseIds, user.id),
    countCourseContent(supabase, courseIds),
    countNewQuestions(supabase, user.id, courseIds),
    countNewSummaries(supabase, user.id, courseIds),
  ]);

  const memberCount = new Map<string, number>();
  for (const m of (allClassMembers ?? []) as Array<{ class_id: string }>) {
    memberCount.set(m.class_id, (memberCount.get(m.class_id) ?? 0) + 1);
  }

  return rows
    .filter((r): r is typeof r & { classes: ClassRow } => r.classes !== null)
    .map((r) => {
      const classCourses = courses
        .filter((c) => c.class_id === r.class_id)
        .map((c) => toCourseSummary(c, counts, myRole, myAdmin, content, newQuestions, newSummaries));
      return {
        id: r.classes.id,
        name: r.classes.name,
        joinCode: r.classes.join_code,
        isAdmin: r.is_admin,
        memberCount: memberCount.get(r.class_id) ?? 1,
        newQuestionCount: classCourses.reduce((n, c) => n + c.newQuestionCount, 0),
        newSummaryCount: classCourses.reduce((n, c) => n + c.newSummaryCount, 0),
        courses: classCourses,
      };
    });
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
  const [{ counts, myRole, myAdmin }, content, newQuestions, newSummaries] = await Promise.all([
    courseMemberInfo(supabase, courseIds, user.id),
    countCourseContent(supabase, courseIds),
    countNewQuestions(supabase, user.id, courseIds),
    countNewSummaries(supabase, user.id, courseIds),
  ]);

  return courses.map((c) =>
    toCourseSummary(c, counts, myRole, myAdmin, content, newQuestions, newSummaries),
  );
});

/**
 * Questions « nouvelles depuis la dernière visite » de tous les cours de la
 * classe, les plus anciennes d'abord (pour les enchaîner dans l'ordre).
 * « Nouvelle » = `created_at > course_reads.seen_at`, hors les siennes.
 */
export const getClassNewQuestions = cache(
  async (classId: string): Promise<ClassNewQuestion[]> => {
    const user = await getUser();
    if (!user) return [];

    const supabase = await createClient();

    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, name")
      .eq("class_id", classId);

    const courses = (coursesData ?? []) as Array<{ id: string; name: string }>;
    if (courses.length === 0) return [];

    const courseIds = courses.map((c) => c.id);
    const courseName = new Map(courses.map((c) => [c.id, c.name]));

    const [{ data: reads, error: readsError }, { data: qs }] = await Promise.all([
      supabase
        .from("course_reads")
        .select("course_id, questions_seen_at")
        .eq("user_id", user.id)
        .in("course_id", courseIds),
      supabase
        .from("questions")
        .select("id, title, kind, course_id, created_at, chapters(name), profiles(display_name)")
        .in("course_id", courseIds)
        .is("deleted_at", null)
        .neq("author_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    // Migration 0018 pas encore appliquée : rien à afficher plutôt que tout.
    if (readsError) return [];

    const seenAt = new Map<string, number>();
    for (const r of (reads ?? []) as Array<{
      course_id: string;
      questions_seen_at: string | null;
    }>) {
      if (r.questions_seen_at) seenAt.set(r.course_id, new Date(r.questions_seen_at).getTime());
    }

    const rows = (
      qs as unknown as Array<{
        id: string;
        title: string;
        kind: QuestionKind;
        course_id: string;
        created_at: string;
        chapters: { name: string } | null;
        profiles: { display_name: string } | null;
      }> | null
    )?.filter((q) => {
      const seen = seenAt.get(q.course_id);
      return seen === undefined || new Date(q.created_at).getTime() > seen;
    });

    if (!rows || rows.length === 0) return [];

    const meta = await enrich(
      supabase,
      rows.map((r) => r.id),
    );

    return rows.map((r) => {
      const m = meta.get(r.id) ?? {
        answerCount: 0,
        commentCount: 0,
        status: "unanswered" as QuestionStatus,
      };
      return {
        id: r.id,
        title: r.title,
        kind: r.kind,
        courseId: r.course_id,
        courseName: courseName.get(r.course_id) ?? "Cours",
        chapterName: r.chapters?.name ?? null,
        authorName: r.profiles?.display_name ?? "Membre",
        createdAt: r.created_at,
        answerCount: m.answerCount,
        commentCount: m.commentCount,
        status: m.status,
      };
    });
  },
);

/**
 * Résumés « nouveaux depuis la dernière visite » de tous les cours de la
 * classe, les plus anciens d'abord. « Nouveau » = `created_at >
 * course_reads.summaries_seen_at`, hors les siens.
 */
export const getClassNewSummaries = cache(
  async (classId: string): Promise<ClassNewSummary[]> => {
    const user = await getUser();
    if (!user) return [];

    const supabase = await createClient();

    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, name")
      .eq("class_id", classId);

    const courses = (coursesData ?? []) as Array<{ id: string; name: string }>;
    if (courses.length === 0) return [];

    const courseIds = courses.map((c) => c.id);
    const courseName = new Map(courses.map((c) => [c.id, c.name]));

    const [{ data: reads, error: readsError }, { data: ss }] = await Promise.all([
      supabase
        .from("course_reads")
        .select("course_id, summaries_seen_at")
        .eq("user_id", user.id)
        .in("course_id", courseIds),
      supabase
        .from("summaries")
        .select(
          "id, title, course_id, created_at, file_path, file_name, chapters(name), author:profiles!summaries_author_id_fkey(display_name)",
        )
        .in("course_id", courseIds)
        .neq("author_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    if (readsError) return [];

    const seenAt = new Map<string, number>();
    for (const r of (reads ?? []) as Array<{
      course_id: string;
      summaries_seen_at: string | null;
    }>) {
      if (r.summaries_seen_at) seenAt.set(r.course_id, new Date(r.summaries_seen_at).getTime());
    }

    const rows = (
      ss as unknown as Array<{
        id: string;
        title: string;
        course_id: string;
        created_at: string;
        file_path: string;
        file_name: string;
        chapters: { name: string } | null;
        author: { display_name: string } | null;
      }> | null
    )?.filter((s) => {
      const seen = seenAt.get(s.course_id);
      return seen === undefined || new Date(s.created_at).getTime() > seen;
    });

    if (!rows || rows.length === 0) return [];

    const urlByPath = await signSummaryFiles(
      supabase,
      rows.map((r) => r.file_path),
    );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      kind: kindOf(r.file_name),
      courseId: r.course_id,
      courseName: courseName.get(r.course_id) ?? "Cours",
      chapterName: r.chapters?.name ?? null,
      authorName: r.author?.display_name ?? "Membre",
      createdAt: r.created_at,
      fileUrl: urlByPath.get(r.file_path) ?? null,
    }));
  },
);

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
