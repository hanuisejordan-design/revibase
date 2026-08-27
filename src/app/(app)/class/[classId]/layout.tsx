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
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
            ← Mes classes
          </Link>
          <h1 className="text-xl font-semibold">{ctx.name}</h1>
        </div>
        <nav className="flex gap-3 pt-1 text-sm">
          <Link
            href={`/class/${classId}`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Accueil
          </Link>
          <Link
            href={`/class/${classId}/questions`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Questions
          </Link>
          <Link
            href={`/class/${classId}/quiz`}
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Quiz
          </Link>
          <Link
            href={`/class/${classId}/settings`}
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
