import type { ClassRole } from "@/constants/app";
import { cn } from "@/lib/utils/cn";

export function RoleBadge({ role }: { role: ClassRole }) {
  const isTrainer = role === "trainer";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isTrainer
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      )}
    >
      {isTrainer ? "Formateur" : "Étudiant"}
    </span>
  );
}
