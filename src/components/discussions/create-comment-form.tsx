"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCommentAction, type CommentFormState } from "@/features/discussions/actions";
import { Button } from "@/components/ui/button";

export function CreateCommentForm({
  courseId,
  questionId,
}: {
  courseId: string;
  questionId: string;
}) {
  const [state, formAction, pending] = useActionState<CommentFormState | undefined, FormData>(
    createCommentAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="questionId" value={questionId} />
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Ajouter au fil de discussion…"
        className="border-border bg-surface focus:border-brand w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
      />
      {state?.errors?.body ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.errors.body}</p>
      ) : null}
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-fit">
        {pending ? "Envoi…" : "Envoyer"}
      </Button>
    </form>
  );
}
