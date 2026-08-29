"use client";

import { useActionState } from "react";
import { createGroupAction, type GroupFormState } from "@/features/groups/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState<GroupFormState | undefined, FormData>(
    createGroupAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Nom du groupe" htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" required autoFocus placeholder="ex. Terminale S — 2026" />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le groupe"}
      </Button>
    </form>
  );
}
