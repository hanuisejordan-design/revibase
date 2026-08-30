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
        <Input id="name" name="name" required autoFocus placeholder="ex. Promo Conduite 2026" />
      </Field>

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
