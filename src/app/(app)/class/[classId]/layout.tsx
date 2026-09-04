import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext } from "@/features/classes/queries";

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-muted hover:bg-background hover:text-foreground -ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium"
          >
            <span aria-hidden>←</span> Tableau de bord
          </Link>
          <Link href={`/class/${classId}`} className="text-xl font-semibold hover:underline">
            {ctx.name}
          </Link>
        </div>
        <Link
          href={`/class/${classId}/settings`}
          className="text-muted pt-1 text-sm hover:underline"
        >
          Paramètres
        </Link>
      </div>
      {children}
    </div>
  );
}
