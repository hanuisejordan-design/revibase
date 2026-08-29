import type { Metadata } from "next";
import Link from "next/link";
import { JoinGroupForm } from "@/components/groups/join-group-form";

export const metadata: Metadata = { title: "Rejoindre un groupe" };

export default function JoinGroupPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Rejoindre un groupe</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Saisis le code du groupe. Tu auras accès à toutes ses classes.
        </p>
      </div>
      <JoinGroupForm />
    </div>
  );
}
