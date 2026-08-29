/** Statut d'affichage d'une réponse, par priorité décroissante. */
export type AnswerStatus = "validated" | "accepted" | "community" | "unverified";

export interface AnswerItem {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  /** Nombre de personnes qui donneraient cette réponse (vote anonyme). */
  voteCount: number;
  /** L'utilisateur courant a-t-il voté pour cette réponse ? */
  viewerHasVoted: boolean;
  /** Retenue par l'auteur de la question. */
  accepted: boolean;
  /** Validée par un formateur. */
  validated: boolean;
  /** Réponse la plus votée de la question (votes > 0). */
  isTopVoted: boolean;
}
