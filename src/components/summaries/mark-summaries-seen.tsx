"use client";

import { useEffect } from "react";
import { markCourseSummariesSeenAction } from "@/features/courses/actions";

/**
 * Ouvrir la liste des résumés d'un cours = « j'ai vu ». Le rendu courant garde
 * l'état d'avant ; l'effet met à jour `course_reads.summaries_seen_at` pour que
 * le compteur « nouveaux résumés » retombe à la prochaine navigation.
 */
export function MarkSummariesSeen({ courseId }: { courseId: string }) {
  useEffect(() => {
    markCourseSummariesSeenAction(courseId).catch(() => {});
  }, [courseId]);
  return null;
}
