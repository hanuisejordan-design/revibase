/** Statut d'affichage d'une réponse, par priorité décroissante. */
export type AnswerStatus = "validated" | "accepted" | "community" | "unverified";

export interface AnswerItem {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  voteCount: number;
  /** L'utilisateur courant a-t-il voté pour cette réponse ? */
  viewerHasVoted: boolean;
  /**
   * Noms des personnes ayant donné / voté cette réponse, « Toi » en premier
   * le cas échéant. Sert à afficher « 3 · Toi, Julie, Marc ».
   */
  voterLabels: string[];
  /** Retenue par l'auteur de la question. */
  accepted: boolean;
  /** Validée par un formateur. */
  validated: boolean;
  /** Réponse la plus votée de la question (votes > 0). */
  isTopVoted: boolean;
}
