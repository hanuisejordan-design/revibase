import Link from "next/link";
import type { ClassSummary } from "@/features/classes/types";

/** Carte d'une classe sur le tableau de bord : aperçu + entrée vers ses cours. */
export function ClassCard({ cls }: { cls: ClassSummary }) {
  const courseCount = cls.courses.length;
  return (
    <Link
      href={`/class/${cls.id}`}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span className="font-medium">{cls.name}</span>
      <span className="text-xs text-zinc-500">
        {courseCount === 0 ? "Aucun cours" : `${courseCount} cours`} · {cls.memberCount} membre
        {cls.memberCount > 1 ? "s" : ""}
        {cls.isAdmin ? " · admin" : ""}
      </span>
    </Link>
  );
}
