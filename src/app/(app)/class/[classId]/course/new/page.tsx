import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClassContext } from "@/features/classes/queries";
import { CreateCourseForm } from "@/components/courses/create-course-form";

export const metadata: Metadata = { title: "Créer un cours" };

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/class/${classId}`);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href={`/class/${classId}`} className="text-xs text-zinc-500 hover:underline">
          ← {ctx.name}
        </Link>
        <h1 className="text-xl font-semibold">Créer un cours</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Il sera rattaché à la classe « {ctx.name} » : tous ses membres y auront accès. Des
          chapitres par défaut sont créés — modifiables ensuite.
        </p>
      </div>
      <CreateCourseForm classId={classId} />
    </div>
  );
}
