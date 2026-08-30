"use client";

import { useActionState, useEffect, useRef } from "react";
import { createChapterAction, type ChapterFormState } from "@/features/chapters/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddChapterForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState<ChapterFormState | undefined, FormData>(
    createChapterAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2" noValidate>
      <div className="flex items-start gap-2">
        <input type="hidden" name="courseId" value={courseId} />
        <Input name="name" placeholder="Nouveau chapitre" required className="max-w-xs" />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "…" : "Ajouter"}
        </Button>
      </div>
      {state?.errors?.name ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.errors.name}</p>
      ) : null}
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
