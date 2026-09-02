"use client";

import { useRouter } from "next/navigation";
import type { ClassOption } from "@/features/classes/queries";
import { NavSheet } from "./nav-sheet";

/** Feuille « Accueil » : tableau de bord ou saut direct vers une classe. */
export function HomeSheet({
  open,
  onClose,
  classes,
}: {
  open: boolean;
  onClose: () => void;
  classes: ClassOption[];
}) {
  const router = useRouter();

  function go(path: string) {
    onClose();
    router.push(path);
  }

  return (
    <NavSheet open={open} onClose={onClose} title="Aller à">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => go("/dashboard")}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Tableau de bord
        </button>

        {classes.length > 0 ? (
          <>
            <p className="mt-2 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Mes classes
            </p>
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go(`/class/${c.id}`)}
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {c.name}
              </button>
            ))}
          </>
        ) : null}
      </div>
    </NavSheet>
  );
}
