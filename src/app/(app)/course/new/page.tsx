import type { Metadata } from "next";
import Link from "next/link";
import { CreateCourseForm } from "@/components/courses/create-course-form";

export const metadata: Metadata = { title: "Créer un cours personnel" };

export default function NewCoursePage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Créer un cours personnel</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Un espace de révision à toi (rattaché à aucune classe) : chapitres, questions, quiz,
          résumés. Tu en es l&apos;administrateur. Des chapitres par défaut sont créés,
          modifiables ensuite.
        </p>
      </div>
      <CreateCourseForm />
    </div>
  );
}
