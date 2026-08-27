"use client";

import { useActionState } from "react";
import { createQuestionAction, type QuestionFormState } from "@/features/questions/actions";
import type { ChapterEntry } from "@/features/chapters/queries";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateQuestionForm({
  classId,
  chapters,
  defaultChapterId,
}: {
  classId: string;
  chapters: ChapterEntry[];
  defaultChapterId?: string;
}) {
  const [state, formAction, pending] = useActionState<QuestionFormState | undefined, FormData>(
    createQuestionAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="classId" value={classId} />

      <Field label="Chapitre" htmlFor="chapterId" error={state?.errors?.chapterId}>
        <select
          id="chapterId"
          name="chapterId"
          defaultValue={defaultChapterId ?? ""}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">— Sans chapitre —</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Question" htmlFor="title" error={state?.errors?.title}>
        <Input
          id="title"
          name="title"
          required
          autoFocus
          placeholder="Formule ta question en une phrase"
        />
      </Field>

      <Field label="Contexte / détails (optionnel)" htmlFor="body" error={state?.errors?.body}>
        <textarea
          id="body"
          name="body"
          rows={5}
          placeholder="Ce que tu as déjà compris, où ça coince, la situation précise…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Publication…" : "Publier"}
      </Button>
    </form>
  );
}
