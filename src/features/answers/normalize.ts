/**
 * Forme normalisée d'une réponse, pour repérer les doublons **exacts** au
 * moment où quelqu'un valide sa réponse.
 *
 * On neutralise seulement ce qui ne change pas le sens : espaces multiples,
 * casse, ponctuation de fin. On **ne corrige pas** les fautes d'orthographe
 * ni les accents — deux formulations qui se ressemblent restent deux réponses
 * distinctes (le vote manuel est là pour les rapprocher).
 */
export function normalizeAnswerBody(body: string): string {
  return body
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(/[.!?…]+$/u, "")
    .trim();
}

/** Deux réponses sont-elles identiques au point d'être fusionnées en un vote ? */
export function isSameAnswer(a: string, b: string): boolean {
  const na = normalizeAnswerBody(a);
  return na.length > 0 && na === normalizeAnswerBody(b);
}
