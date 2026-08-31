import type { QuestionKind } from "@/constants/app";
import type { CourseSummary } from "@/features/courses/types";
import type { QuestionStatus } from "@/features/questions/types";
import type { SummaryItem } from "@/features/summaries/types";

/** Une classe (promo) telle qu'affichée sur le tableau de bord, avec ses cours. */
export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  /** L'utilisateur courant administre-t-il cette classe ? */
  isAdmin: boolean;
  /** Nombre de membres de la classe. */
  memberCount: number;
  /** Somme des « nouvelles questions » sur tous les cours de la classe. */
  newQuestionCount: number;
  /** Somme des « nouveaux résumés » sur tous les cours de la classe. */
  newSummaryCount: number;
  courses: CourseSummary[];
}

/** Contexte de la classe courante (pages `class/[classId]`). */
export interface ClassContext {
  id: string;
  name: string;
  joinCode: string;
  isAdmin: boolean;
}

/**
 * Une question « nouvelle depuis la dernière visite », agrégée sur tous les
 * cours d'une classe (zone `class/[classId]/nouvelles`).
 */
export interface ClassNewQuestion {
  id: string;
  title: string;
  kind: QuestionKind;
  courseId: string;
  courseName: string;
  chapterName: string | null;
  authorName: string;
  createdAt: string;
  answerCount: number;
  commentCount: number;
  status: QuestionStatus;
}

/**
 * Un résumé « nouveau depuis la dernière visite », agrégé sur tous les cours
 * d'une classe (zone `class/[classId]/nouveaux-resumes`).
 */
export interface ClassNewSummary {
  id: string;
  title: string;
  kind: SummaryItem["kind"];
  courseId: string;
  courseName: string;
  chapterName: string | null;
  authorName: string;
  createdAt: string;
  fileUrl: string | null;
}

/** Un membre d'une classe, pour la liste des participants. */
export interface ClassMemberEntry {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  joinedAt: string;
}
