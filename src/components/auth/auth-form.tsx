"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AuthAction = (state: AuthFormState | undefined, formData: FormData) => Promise<AuthFormState>;

type AuthFormProps = {
  mode: "login" | "register";
  action: AuthAction;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState | undefined, FormData>(
    action,
    undefined,
  );
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {isRegister ? (
        <Field label="Nom ou pseudonyme" htmlFor="displayName" error={state?.errors?.displayName}>
          <Input id="displayName" name="displayName" autoComplete="name" required />
        </Field>
      ) : null}

      <Field label="E-mail" htmlFor="email" error={state?.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Mot de passe" htmlFor="password" error={state?.errors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      {state?.notice ? (
        <p className="text-sm text-green-700 dark:text-green-400">{state.notice}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Un instant…" : isRegister ? "Créer mon compte" : "Se connecter"}
      </Button>

      <p className="text-muted text-sm">
        {isRegister ? (
          <>
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium underline">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium underline">
              Créer un compte
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
