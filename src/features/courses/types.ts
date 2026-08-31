import type { CourseRole } from "@/constants/app";

/** Un cours tel qu'affiché dans la liste « mes cours ». */
export interface CourseSummary {
  id: string;
  name: string;
  joinCode: string;
  role: CourseRole;
  /** L'utilisateur courant administre-t-il ce cours ? */
  isAdmin: boolean;
  memberCount: number;
  questionCount: number;
  summaryCount: number;
  /** Questions apparues depuis la dernière visite de la liste (hors les siennes). */
  newQuestionCount: number;
  /** Résumés ajoutés depuis la dernière visite de la liste (hors les siens). */
  newSummaryCount: number;
  /** Classe (promo) propriétaire, ou `null` si le cours est autonome. */
  classId: string | null;
}

/** Contexte du cours courant (pages `course/[courseId]`). */
export interface CourseContext {
  id: string;
  name: string;
  joinCode: string;
  role: CourseRole;
  /** L'utilisateur courant est-il le créateur du cours ? */
  isCreator: boolean;
  /** L'utilisateur courant administre-t-il le cours ? */
  isAdmin: boolean;
  /** A-t-il une ligne `course_members` (par opposition à l'accès via la classe) ? */
  isExplicitMember: boolean;
  /** Classe propriétaire du cours, le cas échéant. */
  classId: string | null;
  classLabel: string | null;
}

/** Un membre d'un cours, pour l'affichage de la liste des participants. */
export interface CourseMemberEntry {
  userId: string;
  displayName: string;
  role: CourseRole;
  isAdmin: boolean;
  joinedAt: string;
}
