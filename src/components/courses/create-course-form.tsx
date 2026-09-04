"use client";

import { useActionState } from "react";
import { createCourseAction, type CourseFormState } from "@/features/courses/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateCourseForm({ classId }: { classId?: string }) {
  const [state, formAction, pending] = useActionState<CourseFormState | undefined, FormData>(
    createCourseAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {classId ? <input type="hidden" name="classId" value={classId} /> : null}
      <Field label="Nom du cours" htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" required autoFocus placeholder="ex. Signalisation" />
      </Field>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="isTrainer" className="mt-0.5" />
        <span>
          Je suis le formateur de ce cours
          <span className="text-muted block text-xs">
            Coche seulement si tu es enseignant : ça te permet de valider les réponses. Sinon, tu en
            restes juste l&apos;administrateur.
          </span>
        </span>
      </label>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le cours"}
      </Button>
    </form>
  );
}
