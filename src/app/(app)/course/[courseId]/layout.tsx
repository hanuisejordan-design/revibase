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
  return { title: ctx?.name ?? "Classe" };
}

export default async function ClassLayout({
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
        <div className="flex flex-col gap-1">
          <Link
            href={ctx.groupId ? `/group/${ctx.groupId}` : "/dashboard"}
            className="text-xs text-zinc-500 hover:underline"
          >
            ← {ctx.groupId ? ctx.groupName : "Mes classes"}
          </Link>
          <h1 className="text-xl font-semibold">{ctx.name}</h1>
        </div>
        <nav className="flex gap-3 pt-1 text-sm">
          <Link
            href={`/course/${courseId}`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Accueil
          </Link>
          <Link
            href={`/course/${courseId}/questions`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Questions
          </Link>
          <Link
            href={`/course/${courseId}/quiz`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Quiz
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
