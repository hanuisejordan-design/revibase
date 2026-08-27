import type { ClassRole } from "@/constants/app";

/** Une classe telle qu'affichée dans la liste « mes classes ». */
export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  role: ClassRole;
  memberCount: number;
}

/** Contexte de la classe courante (page `class/[classId]`). */
export interface ClassContext {
  id: string;
  name: string;
  joinCode: string;
  role: ClassRole;
  /** L'utilisateur courant est-il le créateur de la classe ? */
  isCreator: boolean;
}

/** Un membre d'une classe, pour l'affichage de la liste des participants. */
export interface ClassMemberEntry {
  userId: string;
  displayName: string;
  role: ClassRole;
  joinedAt: string;
}
