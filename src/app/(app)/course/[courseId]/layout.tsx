import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  return { title: ctx?.name ?? "Cours" };
}

export default async function CourseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={ctx.classId ? `/class/${ctx.classId}` : "/dashboard"}
          className="text-muted hover:bg-background hover:text-foreground -ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-sm font-medium"
        >
          <span aria-hidden>←</span> {ctx.classId ? ctx.classLabel : "Mes cours"}
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <Link href={`/course/${courseId}`} className="text-xl font-semibold hover:underline">
            {ctx.name}
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href={`/course/${courseId}/questions`} className="text-muted hover:underline">
              Questions
            </Link>
            <Link href={`/course/${courseId}/summaries`} className="text-muted hover:underline">
              Résumés
            </Link>
            <Link href={`/course/${courseId}/settings`} className="text-muted hover:underline">
              Paramètres
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
