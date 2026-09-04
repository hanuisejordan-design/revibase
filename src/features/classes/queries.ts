import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { CourseRole } from "@/constants/app";
import type { QuestionKind, QuestionPurpose } from "@/constants/app";
import {
  countCourseContent,
  countNewQuestions,
  countNewSummaries,
} from "@/features/courses/queries";
import { enrich } from "@/features/questions/queries";
import { kindOf, signSummaryFiles } from "@/features/summaries/queries";
import { memberSinceByCourse, readQuestionIds, readSummaryIds } from "@/features/reads/queries";
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

/** Nom d'un cours + nom de sa classe parente (`null` si cours personnel). */
type CourseMeta = { name: string; className: string | null };

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

export interface ClassOption {
  id: string;
  name: string;
}

/**
 * Liste plate et légère des classes de l'utilisateur (id + nom), triée par
 * nom. Pour la navigation rapide (feuille « Accueil » de la barre du bas).
 */
export const getMyClassOptions = cache(async (): Promise<ClassOption[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("class_members")
    .select("classes(id, name)")
    .eq("user_id", user.id);

  const out: ClassOption[] = [];
  for (const row of (data ?? []) as unknown as Array<{
    classes: { id: string; name: string } | { id: string; name: string }[] | null;
  }>) {
    const c = Array.isArray(row.classes) ? (row.classes[0] ?? null) : row.classes;
    if (c) out.push({ id: c.id, name: c.name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "fr"));
});

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
        .map((c) =>
          toCourseSummary(c, counts, myRole, myAdmin, content, newQuestions, newSummaries),
        );
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
 * Cœur partagé : questions non encore ouvertes des cours donnés, les plus
 * anciennes d'abord. « Nouvelle » = créée après l'arrivée du membre, pas de
 * lui, et absente de `question_reads`.
 */
async function collectNewQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
  courseMeta: Map<string, CourseMeta>,
): Promise<ClassNewQuestion[]> {
  if (courseIds.length === 0) return [];

  const [baseline, { data: qs }] = await Promise.all([
    memberSinceByCourse(supabase, userId, courseIds),
    supabase
      .from("questions")
      .select(
        "id, title, kind, purpose, course_id, created_at, chapters(name), author:profiles!questions_author_id_fkey(display_name)",
      )
      .in("course_id", courseIds)
      .is("deleted_at", null)
      .neq("author_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const candidates = (
    qs as unknown as Array<{
      id: string;
      title: string;
      kind: QuestionKind;
      purpose: QuestionPurpose;
      course_id: string;
      created_at: string;
      chapters: { name: string } | null;
      author: { display_name: string } | null;
    }> | null
  )?.filter((q) => new Date(q.created_at).getTime() > (baseline.get(q.course_id) ?? 0));

  if (!candidates || candidates.length === 0) return [];

  const read = await readQuestionIds(
    supabase,
    userId,
    candidates.map((c) => c.id),
  );
  if (!read) return [];

  const rows = candidates.filter((q) => !read.has(q.id));
  if (rows.length === 0) return [];

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
      purpose: r.purpose,
      courseId: r.course_id,
      courseName: courseMeta.get(r.course_id)?.name ?? "Cours",
      className: courseMeta.get(r.course_id)?.className ?? null,
      chapterName: r.chapters?.name ?? null,
      authorName: r.author?.display_name ?? "Membre",
      createdAt: r.created_at,
      answerCount: m.answerCount,
      commentCount: m.commentCount,
      status: m.status,
    };
  });
}

/** Cœur partagé : résumés non encore ouverts des cours donnés. */
async function collectNewSummaries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
  courseMeta: Map<string, CourseMeta>,
): Promise<ClassNewSummary[]> {
  if (courseIds.length === 0) return [];

  const [baseline, { data: ss }] = await Promise.all([
    memberSinceByCourse(supabase, userId, courseIds),
    supabase
      .from("summaries")
      .select(
        "id, title, course_id, created_at, file_path, file_name, chapters(name), author:profiles!summaries_author_id_fkey(display_name)",
      )
      .in("course_id", courseIds)
      .neq("author_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const candidates = (
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
  )?.filter((s) => new Date(s.created_at).getTime() > (baseline.get(s.course_id) ?? 0));

  if (!candidates || candidates.length === 0) return [];

  const read = await readSummaryIds(
    supabase,
    userId,
    candidates.map((c) => c.id),
  );
  if (!read) return [];

  const rows = candidates.filter((s) => !read.has(s.id));
  if (rows.length === 0) return [];

  const urlByPath = await signSummaryFiles(
    supabase,
    rows.map((r) => r.file_path),
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: kindOf(r.file_name),
    courseId: r.course_id,
    courseName: courseMeta.get(r.course_id)?.name ?? "Cours",
    className: courseMeta.get(r.course_id)?.className ?? null,
    chapterName: r.chapters?.name ?? null,
    authorName: r.author?.display_name ?? "Membre",
    createdAt: r.created_at,
    fileUrl: urlByPath.get(r.file_path) ?? null,
  }));
}

/**
 * Résout tous les cours accessibles (id → nom + classe parente) pour l'agrégat
 * « mes nouveautés ». `className` vaut `null` pour un cours personnel.
 */
async function myCourseMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Map<string, CourseMeta>> {
  const [{ data: direct }, { data: myClasses }] = await Promise.all([
    supabase
      .from("course_members")
      .select("courses(id, name, class_id, classes(name))")
      .eq("user_id", userId),
    supabase.from("class_members").select("class_id, classes(name)").eq("user_id", userId),
  ]);

  const one = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  const out = new Map<string, CourseMeta>();
  for (const row of (direct ?? []) as unknown as Array<{
    courses:
      | {
          id: string;
          name: string;
          class_id: string | null;
          classes: { name: string } | { name: string }[] | null;
        }
      | Array<{
          id: string;
          name: string;
          class_id: string | null;
          classes: { name: string } | { name: string }[] | null;
        }>
      | null;
  }>) {
    const c = one(row.courses);
    if (c) out.set(c.id, { name: c.name, className: one(c.classes)?.name ?? null });
  }

  const classNameById = new Map<string, string>();
  for (const row of (myClasses ?? []) as unknown as Array<{
    class_id: string;
    classes: { name: string } | { name: string }[] | null;
  }>) {
    const n = one(row.classes)?.name;
    if (n) classNameById.set(row.class_id, n);
  }

  const classIds = [...classNameById.keys()];
  if (classIds.length > 0) {
    const { data: cc } = await supabase
      .from("courses")
      .select("id, name, class_id")
      .in("class_id", classIds);
    for (const c of (cc ?? []) as Array<{ id: string; name: string; class_id: string }>) {
      if (!out.has(c.id)) {
        out.set(c.id, { name: c.name, className: classNameById.get(c.class_id) ?? null });
      }
    }
  }
  return out;
}

/** Toutes mes nouvelles questions, tous cours confondus (classes + perso). */
export const getMyNewQuestions = cache(async (): Promise<ClassNewQuestion[]> => {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const meta = await myCourseMeta(supabase, user.id);
  return collectNewQuestions(supabase, user.id, [...meta.keys()], meta);
});

/** Tous mes nouveaux résumés, tous cours confondus. */
export const getMyNewSummaries = cache(async (): Promise<ClassNewSummary[]> => {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const meta = await myCourseMeta(supabase, user.id);
  return collectNewSummaries(supabase, user.id, [...meta.keys()], meta);
});

/**
 * Questions non encore ouvertes de tous les cours de la classe, les plus
 * anciennes d'abord (pour les enchaîner).
 */
export const getClassNewQuestions = cache(async (classId: string): Promise<ClassNewQuestion[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  const [{ data: coursesData }, { data: cls }] = await Promise.all([
    supabase.from("courses").select("id, name").eq("class_id", classId),
    supabase.from("classes").select("name").eq("id", classId).maybeSingle(),
  ]);

  const courses = (coursesData ?? []) as Array<{ id: string; name: string }>;
  if (courses.length === 0) return [];

  const className = (cls as { name: string } | null)?.name ?? null;
  return collectNewQuestions(
    supabase,
    user.id,
    courses.map((c) => c.id),
    new Map(courses.map((c) => [c.id, { name: c.name, className }])),
  );
});

/** Résumés non encore ouverts de tous les cours de la classe, les plus anciens d'abord. */
export const getClassNewSummaries = cache(async (classId: string): Promise<ClassNewSummary[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();

  const [{ data: coursesData }, { data: cls }] = await Promise.all([
    supabase.from("courses").select("id, name").eq("class_id", classId),
    supabase.from("classes").select("name").eq("id", classId).maybeSingle(),
  ]);

  const courses = (coursesData ?? []) as Array<{ id: string; name: string }>;
  if (courses.length === 0) return [];

  const className = (cls as { name: string } | null)?.name ?? null;
  return collectNewSummaries(
    supabase,
    user.id,
    courses.map((c) => c.id),
    new Map(courses.map((c) => [c.id, { name: c.name, className }])),
  );
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
