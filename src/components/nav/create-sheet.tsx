"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseOption } from "@/features/courses/queries";
import { listCourseChaptersAction } from "@/features/chapters/actions";
import { NavSheet } from "./nav-sheet";

type Chapter = { id: string; name: string };
type CreateType = "question" | "summary" | "quiz";

const TYPES: { value: CreateType; label: string; cta: string }[] = [
  { value: "question", label: "Poser une question", cta: "Poser la question" },
  { value: "summary", label: "Ajouter un résumé", cta: "Ajouter le résumé" },
  { value: "quiz", label: "Faire un quiz", cta: "Lancer le quiz" },
];

const selectCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

/** Feuille « + » : d'abord QUOI créer, puis dans quel cours (et chapitre). */
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
  // `key` sur ce composant (côté parent) le remonte à chaque ouverture.
  const router = useRouter();
  const [type, setType] = useState<CreateType | null>(null);
  const [courseId, setCourseId] = useState<string>(currentCourseId ?? "");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersFor, setChaptersFor] = useState<string>(""); // cours dont `chapters` dépend
  const [chapterId, setChapterId] = useState<string>("");

  // Chapitres du cours choisi — uniquement utile pour « poser une question ».
  useEffect(() => {
    if (type !== "question" || !courseId) return;
    let cancelled = false;
    listCourseChaptersAction(courseId)
      .then((ch) => {
        if (cancelled) return;
        setChapters(ch);
        setChaptersFor(courseId);
        setChapterId((cur) => cur || (ch[0]?.id ?? ""));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, courseId]);

  function pickCourse(id: string) {
    setCourseId(id);
    setChapters([]);
    setChaptersFor("");
    setChapterId("");
  }

  const chaptersLoading = Boolean(courseId) && chaptersFor !== courseId;

  function submit() {
    if (!type || !courseId) return;
    const path =
      type === "question"
        ? `/course/${courseId}/questions/new${chapterId ? `?chapter=${chapterId}` : ""}`
        : type === "summary"
          ? `/course/${courseId}/summaries/new`
          : `/course/${courseId}/quiz`;
    onClose();
    router.push(path);
  }

  const chosen = TYPES.find((t) => t.value === type);

  return (
    <NavSheet open={open} onClose={onClose} title="Créer">
      {!type ? (
        <div className="flex flex-col gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className="border-border hover:bg-background rounded-lg border px-3 py-3 text-left text-sm font-medium"
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setType(null)}
            className="text-muted w-fit text-xs hover:underline"
          >
            ← Autre type
          </button>
          <p className="text-sm font-medium">{chosen?.label}</p>

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

          {type === "question" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Chapitre</span>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={!courseId || chaptersLoading || chapters.length === 0}
                className={selectCls}
              >
                {!courseId ? (
                  <option value="">— Choisis d&apos;abord un cours —</option>
                ) : chaptersLoading ? (
                  <option value="">Chargement…</option>
                ) : chapters.length === 0 ? (
                  <option value="">— Ce cours n&apos;a pas de chapitre —</option>
                ) : (
                  chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))
                )}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            disabled={!courseId}
            onClick={submit}
            className="bg-brand text-brand-foreground mt-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            {chosen?.cta}
          </button>
        </div>
      )}
    </NavSheet>
  );
}
