import type { ClassRole } from "@/constants/app";

/** Une classe telle qu'affichée dans la liste « mes classes ». */
export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  role: ClassRole;
  memberCount: number;
  /** Groupe propriétaire, ou `null` si la classe est autonome. */
  groupId: string | null;
}

/** Contexte de la classe courante (page `class/[classId]`). */
export interface ClassContext {
  id: string;
  name: string;
  joinCode: string;
  role: ClassRole;
  /** L'utilisateur courant est-il le créateur de la classe ? */
  isCreator: boolean;
  /** A-t-il une ligne `class_members` (par opposition à l'accès via le groupe) ? */
  isExplicitMember: boolean;
  /** Groupe propriétaire de la classe, le cas échéant. */
  groupId: string | null;
  groupName: string | null;
}

/** Un membre d'une classe, pour l'affichage de la liste des participants. */
export interface ClassMemberEntry {
  userId: string;
  displayName: string;
  role: ClassRole;
  joinedAt: string;
}
