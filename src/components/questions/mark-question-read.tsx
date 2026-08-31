"use client";

import { useEffect } from "react";
import { markQuestionReadAction } from "@/features/reads/actions";

/**
 * Monté sur la page détail d'une question : l'ouvrir = l'avoir vue. C'est le
 * seul moment où une question quitte la liste des « nouvelles ».
 */
export function MarkQuestionRead({ questionId }: { questionId: string }) {
  useEffect(() => {
    markQuestionReadAction(questionId).catch(() => {});
  }, [questionId]);
  return null;
}
