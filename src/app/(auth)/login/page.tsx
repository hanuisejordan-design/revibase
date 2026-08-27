import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Se connecter</h1>
      <AuthForm mode="login" action={signInAction} />
    </div>
  );
}
