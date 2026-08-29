import type { Metadata } from "next";
import Link from "next/link";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export const metadata: Metadata = { title: "Créer un groupe" };

export default function NewGroupPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Créer un groupe</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Un groupe rassemble plusieurs classes (une promo, un centre de formation…). Tu en
          deviens administrateur et tu pourras y créer des classes. Ceux qui rejoignent le
          groupe avec son code ont accès à toutes ses classes.
        </p>
      </div>
      <CreateGroupForm />
    </div>
  );
}
