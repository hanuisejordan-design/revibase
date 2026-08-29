import type { QuestionKind } from "@/constants/app";

export type ReferenceKind = "validated" | "accepted" | "community" | null;

export interface QuizOption {
  id: string;
  body: string;
  isCorrect: boolean;
}

/** Une question telle que présentée pendant le quiz. */
export interface QuizQuestionCard {
  quizQuestionId: string;
  questionId: string;
  position: number;
  kind: QuestionKind;
  title: string;
  body: string | null;
  chapterName: string | null;
  /** URL signée de la photo attachée, ou `null`. */
  imageUrl: string | null;
  /** Questions ouvertes : auto-évaluation. */
  referenceAnswer: string | null;
  referenceKind: ReferenceKind;
  /** QCM / vrai-faux : options (corrigées automatiquement). */
  options: QuizOption[];
}

export interface QuizRunnerData {
  attemptId: string;
  questions: QuizQuestionCard[];
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  chapterLabel: string;
  toReview: { questionId: string; title: string }[];
}

export interface AttemptSummary {
  id: string;
  score: number | null;
  total: number | null;
  completedAt: string | null;
  startedAt: string;
  chapterLabel: string;
}
