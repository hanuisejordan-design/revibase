import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Créer un compte</h1>
      <AuthForm mode="register" action={signUpAction} />
    </div>
  );
}
