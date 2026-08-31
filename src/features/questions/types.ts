import type { QuestionKind, QuestionPurpose } from "@/constants/app";

/** Statut d'une question ouverte dans la liste, dérivé de ses réponses. */
export type QuestionStatus = "validated" | "answered" | "unanswered";

export interface QuestionOption {
  id: string;
  body: string;
  isCorrect: boolean;
  position: number;
}

/** Une question telle qu'affichée dans la liste ou sur l'accueil de classe. */
export interface QuestionListItem {
  id: string;
  title: string;
  kind: QuestionKind;
  purpose: QuestionPurpose;
  chapterId: string | null;
  chapterName: string | null;
  authorName: string;
  createdAt: string;
  answerCount: number;
  commentCount: number;
  status: QuestionStatus;
  /** URL signée de la photo attachée, ou `null`. */
  imageUrl: string | null;
}

/** Détail complet d'une question (page dédiée). */
export interface QuestionDetail {
  id: string;
  title: string;
  body: string | null;
  kind: QuestionKind;
  purpose: QuestionPurpose;
  options: QuestionOption[];
  chapterId: string | null;
  chapterName: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  answerCount: number;
  commentCount: number;
  isAuthor: boolean;
  /** URL signée de la photo attachée, ou `null`. */
  imageUrl: string | null;
}
