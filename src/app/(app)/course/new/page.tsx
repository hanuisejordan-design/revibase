import type { Metadata } from "next";
import Link from "next/link";
import { CreateCourseForm } from "@/components/courses/create-course-form";

export const metadata: Metadata = { title: "Créer un cours" };

export default function NewCoursePage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Créer un cours</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tu en deviens le formateur. Des chapitres par défaut sont créés (Signalisation,
          Réglementation, Matériel, Sécurité) — modifiables plus tard.
        </p>
      </div>
      <CreateCourseForm />
    </div>
  );
}
