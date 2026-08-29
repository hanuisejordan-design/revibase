"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnswerAction, type AnswerFormState } from "@/features/answers/actions";
import { Button } from "@/components/ui/button";

export function CreateAnswerForm({ classId, questionId }: { classId: string; questionId: string }) {
  const [state, formAction, pending] = useActionState<AnswerFormState | undefined, FormData>(
    createAnswerAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  const merged = state?.ok ? state.merged : undefined;

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="questionId" value={questionId} />
      <label htmlFor="body" className="text-sm font-medium">
        Écrire une réponse
      </label>
      <textarea
        id="body"
        name="body"
        rows={4}
        required
        placeholder="Ta réponse, avec le raisonnement si possible."
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
      />
      {state?.errors?.body ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.errors.body}</p>
      ) : null}
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
      {merged ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          Ta réponse rejoignait celle de {merged.authorName} — ton vote a été ajouté.
        </p>
      ) : state?.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">Réponse publiée.</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Publication…" : "Publier la réponse"}
      </Button>
    </form>
  );
}
