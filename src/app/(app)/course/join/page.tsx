import type { Metadata } from "next";
import Link from "next/link";
import { JoinCourseForm } from "@/components/courses/join-course-form";

export const metadata: Metadata = { title: "Rejoindre un cours" };

export default function JoinCoursePage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-muted text-xs hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Rejoindre un cours</h1>
        <p className="text-muted text-sm">
          Saisis le code d&apos;invitation communiqué par ton formateur ou un camarade.
        </p>
      </div>
      <JoinCourseForm />
    </div>
  );
}
