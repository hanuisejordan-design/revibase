import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Bonjour {user.displayName}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Ton compte fonctionne. Les classes, les questions et les quiz arrivent aux prochaines
        étapes.
      </p>
    </div>
  );
}
