import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { PageHero, heroNavLink } from "@/components/layout/page-hero";

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
      <PageHero
        backHref={ctx.classId ? `/class/${ctx.classId}` : "/dashboard"}
        backLabel={ctx.classId ? (ctx.classLabel ?? "Classe") : "Mes cours"}
        title={ctx.name}
        titleHref={`/course/${courseId}`}
        nav={
          <nav className="flex gap-4">
            <Link href={`/course/${courseId}/questions`} className={heroNavLink}>
              Questions
            </Link>
            <Link href={`/course/${courseId}/summaries`} className={heroNavLink}>
              Résumés
            </Link>
            <Link href={`/course/${courseId}/settings`} className={heroNavLink}>
              Paramètres
            </Link>
          </nav>
        }
      />
      {children}
    </div>
  );
}
