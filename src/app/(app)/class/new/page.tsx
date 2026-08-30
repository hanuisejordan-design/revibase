import type { Metadata } from "next";
import Link from "next/link";
import { CreateClassForm } from "@/components/classes/create-class-form";

export const metadata: Metadata = { title: "Créer une classe" };

export default function NewClassPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Créer une classe</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Une classe rassemble plusieurs cours (une promo, un centre de formation…). Tu en
          deviens administrateur et tu pourras y créer des cours. Ceux qui rejoignent la
          classe avec son code ont accès à tous ses cours.
        </p>
      </div>
      <CreateClassForm />
    </div>
  );
}
