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
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <Link
            href={ctx.classId ? `/class/${ctx.classId}` : "/dashboard"}
            className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <span aria-hidden>←</span> {ctx.classId ? ctx.classLabel : "Mes cours"}
          </Link>
          <Link href={`/course/${courseId}`} className="text-xl font-semibold hover:underline">
            {ctx.name}
          </Link>
        </div>
        <nav className="flex gap-3 pt-1 text-sm">
          <Link
            href={`/course/${courseId}/questions`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Questions
          </Link>
          <Link
            href={`/course/${courseId}/summaries`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Résumés
          </Link>
          <Link
            href={`/course/${courseId}/settings`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Paramètres
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
