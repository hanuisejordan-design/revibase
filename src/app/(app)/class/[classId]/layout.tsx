import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext } from "@/features/classes/queries";
import { PageHero, heroNavLink } from "@/components/layout/page-hero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string }>;
}): Promise<Metadata> {
  const { classId } = await params;
  const ctx = await getClassContext(classId);
  return { title: ctx?.name ?? "Classe" };
}

export default async function ClassLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        backHref="/dashboard"
        backLabel="Tableau de bord"
        title={ctx.name}
        titleHref={`/class/${classId}`}
        nav={
          <Link href={`/class/${classId}/settings`} className={heroNavLink}>
            Paramètres
          </Link>
        }
      />
      {children}
    </div>
  );
}
