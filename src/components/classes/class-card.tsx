import Link from "next/link";
import type { ClassSummary } from "@/features/classes/types";
import { RoleBadge } from "./role-badge";

/** Carte d'une classe, utilisée sur le tableau de bord et la page d'un groupe. */
export function ClassCard({ cls }: { cls: ClassSummary }) {
  return (
    <Link
      href={`/class/${cls.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="font-medium">{cls.name}</span>
      <span className="flex items-center gap-2 text-xs text-zinc-500">
        <RoleBadge role={cls.role} />
        {cls.memberCount} membre{cls.memberCount > 1 ? "s" : ""}
      </span>
    </Link>
  );
}
