import type { Metadata } from "next";
import Link from "next/link";
import { JoinClassForm } from "@/components/classes/join-class-form";

export const metadata: Metadata = { title: "Rejoindre une classe" };

export default function JoinClassPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-muted text-xs hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Rejoindre une classe</h1>
        <p className="text-muted text-sm">
          Saisis le code de la classe. Tu auras accès à tous ses cours.
        </p>
      </div>
      <JoinClassForm />
    </div>
  );
}
