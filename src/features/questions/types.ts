/** Statut d'une question dans la liste, dérivé de ses réponses. */
export type QuestionStatus = "validated" | "answered" | "unanswered";

/** Une question telle qu'affichée dans la liste ou sur l'accueil de classe. */
export interface QuestionListItem {
  id: string;
  title: string;
  chapterId: string | null;
  chapterName: string | null;
  authorName: string;
  createdAt: string;
  answerCount: number;
  commentCount: number;
  status: QuestionStatus;
}

/** Détail complet d'une question (page dédiée). */
export interface QuestionDetail {
  id: string;
  title: string;
  body: string | null;
  chapterId: string | null;
  chapterName: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  answerCount: number;
  commentCount: number;
  isAuthor: boolean;
}
