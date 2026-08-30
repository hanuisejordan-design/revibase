import type { CourseRole } from "@/constants/app";

/** Une classe telle qu'affichée dans la liste « mes classes ». */
export interface CourseSummary {
  id: string;
  name: string;
  joinCode: string;
  role: CourseRole;
  memberCount: number;
  /** Groupe propriétaire, ou `null` si la classe est autonome. */
  groupId: string | null;
}

/** Contexte de la classe courante (page `class/[courseId]`). */
export interface CourseContext {
  id: string;
  name: string;
  joinCode: string;
  role: CourseRole;
  /** L'utilisateur courant est-il le créateur de la classe ? */
  isCreator: boolean;
  /** A-t-il une ligne `class_members` (par opposition à l'accès via le groupe) ? */
  isExplicitMember: boolean;
  /** Groupe propriétaire de la classe, le cas échéant. */
  groupId: string | null;
  groupName: string | null;
}

/** Un membre d'une classe, pour l'affichage de la liste des participants. */
export interface CourseMemberEntry {
  userId: string;
  displayName: string;
  role: CourseRole;
  joinedAt: string;
}
