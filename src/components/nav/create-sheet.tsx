"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseOption } from "@/features/courses/queries";
import { listCourseChaptersAction } from "@/features/chapters/actions";
import { NavSheet } from "./nav-sheet";

type Chapter = { id: string; name: string };

const selectCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";
const actionCls =
  "rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm font-medium hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** Feuille « + » : créer une question / un résumé / un quiz dans un cours. */
export function CreateSheet({
  open,
  onClose,
  courses,
  currentCourseId,
}: {
  open: boolean;
  onClose: () => void;
  courses: CourseOption[];
  currentCourseId: string | null;
}) {
  // `key` sur ce composant (côté parent) le remonte à chaque ouverture, donc
  // l'état repart du cours courant sans effet de synchronisation.
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>(currentCourseId ?? "");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState<string>("");

  // Charge les chapitres du cours choisi (pour « poser une question »).
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    listCourseChaptersAction(courseId)
      .then((ch) => {
        if (cancelled) return;
        setChapters(ch);
        setChapterId((cur) => cur || (ch[0]?.id ?? ""));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function pickCourse(id: string) {
    setCourseId(id);
    setChapters([]);
    setChapterId("");
  }

  function go(path: string) {
    onClose();
    router.push(path);
  }

  const disabled = !courseId;

  return (
    <NavSheet open={open} onClose={onClose} title="Créer">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Dans quel cours ?</span>
          <select
            value={courseId}
            onChange={(e) => pickCourse(e.target.value)}
            className={selectCls}
          >
            <option value="">— Choisir un cours —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className ? `${c.className} · ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </label>

        {courseId && chapters.length > 0 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Chapitre (pour une question)</span>
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className={selectCls}
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              go(
                `/course/${courseId}/questions/new${chapterId ? `?chapter=${chapterId}` : ""}`,
              )
            }
            className={actionCls}
          >
            Poser une question
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => go(`/course/${courseId}/summaries/new`)}
            className={actionCls}
          >
            Ajouter un résumé
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => go(`/course/${courseId}/quiz`)}
            className={actionCls}
          >
            Faire un quiz
          </button>
        </div>
      </div>
    </NavSheet>
  );
}
