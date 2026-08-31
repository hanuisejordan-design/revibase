"use client";

import { useEffect } from "react";
import { markClassSummariesSeenAction } from "@/features/courses/actions";

/**
 * Ouvrir la zone « nouveaux résumés » d'une classe = tout marquer vu. Le
 * rendu courant montre encore la liste ; l'effet met à jour
 * `course_reads.summaries_seen_at` (par cours) pour la prochaine visite.
 */
export function MarkClassSummariesSeen({ classId }: { classId: string }) {
  useEffect(() => {
    markClassSummariesSeenAction(classId).catch(() => {});
  }, [classId]);
  return null;
}
