"use client";

import { useActionState } from "react";
import { createClassAction, type ClassFormState } from "@/features/classes/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateClassForm() {
  const [state, formAction, pending] = useActionState<ClassFormState | undefined, FormData>(
    createClassAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Nom de la classe" htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" required autoFocus placeholder="ex. Terminale S — 2026" />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer la classe"}
      </Button>
    </form>
  );
}
