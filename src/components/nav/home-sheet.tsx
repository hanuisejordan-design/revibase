"use client";

import { useRouter } from "next/navigation";
import type { ClassOption } from "@/features/classes/queries";
import type { CourseOption } from "@/features/courses/queries";
import { NavSheet } from "./nav-sheet";

/**
 * Feuille « Accueil » = le niveau du tableau de bord : tableau de bord, mes
 * classes, mes cours personnels. (Les cours qui sont DANS une classe sont dans
 * la feuille « Cours ».)
 */
export function HomeSheet({
  open,
  onClose,
  classes,
  personalCourses,
}: {
  open: boolean;
  onClose: () => void;
  classes: ClassOption[];
  personalCourses: CourseOption[];
}) {
  const router = useRouter();

  function go(path: string) {
    onClose();
    router.push(path);
  }

  const rowCls = "rounded-lg px-3 py-2 text-left text-sm hover:bg-background";
  const headCls = "mt-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase";

  return (
    <NavSheet open={open} onClose={onClose} title="Aller à">
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => go("/dashboard")} className={`${rowCls} font-medium`}>
          Tableau de bord
        </button>

        {classes.length > 0 ? (
          <>
            <p className={headCls}>Mes classes</p>
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go(`/class/${c.id}`)}
                className={rowCls}
              >
                {c.name}
              </button>
            ))}
          </>
        ) : null}

        {personalCourses.length > 0 ? (
          <>
            <p className={headCls}>Mes cours personnels</p>
            {personalCourses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go(`/course/${c.id}`)}
                className={rowCls}
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
