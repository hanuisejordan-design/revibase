"use client";

import { useActionState } from "react";
import { createQuizAction, type QuizFormState } from "@/features/quizzes/actions";
import type { ChapterEntry } from "@/features/chapters/queries";
import { QUIZ_DEFAULT_QUESTIONS, QUIZ_MAX_QUESTIONS, QUIZ_MIN_QUESTIONS } from "@/constants/app";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateQuizForm({
  classId,
  chapters,
}: {
  classId: string;
  chapters: ChapterEntry[];
}) {
  const [state, formAction, pending] = useActionState<QuizFormState | undefined, FormData>(
    createQuizAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="classId" value={classId} />

      <Field label="Chapitre" htmlFor="chapterId" error={state?.errors?.chapterId}>
        <select
          id="chapterId"
          name="chapterId"
          defaultValue=""
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Tous les chapitres</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nombre de questions" htmlFor="count" error={state?.errors?.count}>
        <Input
          id="count"
          name="count"
          type="number"
          min={QUIZ_MIN_QUESTIONS}
          max={QUIZ_MAX_QUESTIONS}
          defaultValue={QUIZ_DEFAULT_QUESTIONS}
          className="w-24"
        />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Préparation…" : "Commencer"}
      </Button>
    </form>
  );
}
