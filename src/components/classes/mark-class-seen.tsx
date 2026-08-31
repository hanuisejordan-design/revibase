"use client";

import { useEffect } from "react";
import { markClassQuestionsSeenAction } from "@/features/courses/actions";

/**
 * Ouvrir la zone « nouvelles questions » d'une classe = tout marquer vu. Le
 * rendu courant montre encore la liste ; l'effet vide `course_reads` pour la
 * prochaine visite (comme « ouvrir /notifications = tout lu »).
 */
export function MarkClassSeen({ classId }: { classId: string }) {
  useEffect(() => {
    markClassQuestionsSeenAction(classId).catch(() => {});
  }, [classId]);
  return null;
}
