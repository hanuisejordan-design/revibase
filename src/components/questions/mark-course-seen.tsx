"use client";

import { useEffect } from "react";
import { markCourseQuestionsSeenAction } from "@/features/courses/actions";

/**
 * Ouvrir la liste des questions d'un cours = « j'ai vu ». Le rendu courant
 * garde l'état d'avant ; l'effet met à jour `course_reads` pour que le
 * compteur « nouvelles » retombe à la prochaine navigation.
 */
export function MarkCourseSeen({ courseId }: { courseId: string }) {
  useEffect(() => {
    markCourseQuestionsSeenAction(courseId).catch(() => {});
  }, [courseId]);
  return null;
}
