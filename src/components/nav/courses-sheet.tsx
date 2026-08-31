"use client";

import { useRouter } from "next/navigation";
import type { CourseOption } from "@/features/courses/queries";
import { NavSheet } from "./nav-sheet";

/** Feuille « Cours » : saute vers n'importe quel cours accessible. */
export function CoursesSheet({
  open,
  onClose,
  courses,
}: {
  open: boolean;
  onClose: () => void;
  courses: CourseOption[];
}) {
  const router = useRouter();

  function go(id: string) {
    onClose();
    router.push(`/course/${id}`);
  }

  // Regroupé par classe (les cours autonomes en dernier).
  const groups = new Map<string, CourseOption[]>();
  for (const c of courses) {
    const key = c.className ?? "￿Personnels";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => a.localeCompare(b, "fr"));

  return (
    <NavSheet open={open} onClose={onClose} title="Aller à un cours">
      {courses.length === 0 ? (
        <p className="py-4 text-sm text-zinc-500">Tu n&apos;as encore aucun cours.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedKeys.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <p className="px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                {key === "￿Personnels" ? "Cours personnels" : key}
              </p>
              {groups.get(key)!.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(c.id)}
                  className="rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {c.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </NavSheet>
  );
}
