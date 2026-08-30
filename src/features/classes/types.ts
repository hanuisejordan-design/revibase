import type { CourseSummary } from "@/features/courses/types";

/** Une classe (promo) telle qu'affichée sur le tableau de bord, avec ses cours. */
export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  /** L'utilisateur courant administre-t-il cette classe ? */
  isAdmin: boolean;
  courses: CourseSummary[];
}

/** Contexte de la classe courante (pages `class/[classId]`). */
export interface ClassContext {
  id: string;
  name: string;
  joinCode: string;
  isAdmin: boolean;
}

/** Un membre d'une classe, pour la liste des participants. */
export interface ClassMemberEntry {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  joinedAt: string;
}
