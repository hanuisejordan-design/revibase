"use client";

import { useActionState } from "react";
import { joinCourseAction, type CourseFormState } from "@/features/courses/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function JoinCourseForm() {
  const [state, formAction, pending] = useActionState<CourseFormState | undefined, FormData>(
    joinCourseAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Code d'invitation" htmlFor="code" error={state?.errors?.code}>
        <Input
          id="code"
          name="code"
          required
          autoFocus
          autoCapitalize="characters"
          placeholder="ex. AB12CD34"
          className="font-mono tracking-widest uppercase"
        />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adhésion…" : "Rejoindre la classe"}
      </Button>
    </form>
  );
}
