import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseContext } from "@/features/courses/queries";
import { listChapters } from "@/features/chapters/queries";
import { listMyAttempts } from "@/features/quizzes/queries";
import { CreateQuizForm } from "@/components/quizzes/create-quiz-form";
import { AttemptList } from "@/components/quizzes/attempt-list";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const ctx = await getCourseContext(courseId);
  if (!ctx) notFound();

  const [chapters, attempts] = await Promise.all([
    listChapters(courseId),
    listMyAttempts(courseId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Faire un quiz</h2>
        <p className="text-muted text-sm">
          L&apos;app tire des questions du cours. Les QCM et vrai/faux sont corrigés automatiquement
          ; pour les questions ouvertes, tu révèles la réponse de référence et tu dis si tu la
          savais.
        </p>
        <CreateQuizForm courseId={courseId} chapters={chapters} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
          Mes quiz récents
        </h2>
        <AttemptList courseId={courseId} attempts={attempts} />
      </section>
    </div>
  );
}
