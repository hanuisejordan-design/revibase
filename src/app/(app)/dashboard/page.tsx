import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getMyClasses } from "@/features/classes/queries";
import { RoleBadge } from "@/components/classes/role-badge";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const user = await requireUser();
  const classes = await getMyClasses();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Bonjour {user.displayName}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {classes.length === 0
            ? "Crée ta classe, ou rejoins-en une avec un code d'invitation."
            : "Choisis une classe pour continuer."}
        </p>
      </div>

      {classes.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/class/${c.id}`}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <span className="font-medium">{c.name}</span>
                <span className="flex items-center gap-2 text-xs text-zinc-500">
                  <RoleBadge role={c.role} />
                  {c.memberCount} membre{c.memberCount > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/class/new"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Créer une classe
        </Link>
        <Link
          href="/class/join"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Rejoindre avec un code
        </Link>
      </div>
    </div>
  );
}
