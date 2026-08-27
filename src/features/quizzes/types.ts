export type ReferenceKind = "validated" | "accepted" | "community" | null;

/** Une question telle que présentée pendant le quiz (auto-évaluation). */
export interface QuizQuestionCard {
  quizQuestionId: string;
  questionId: string;
  position: number;
  title: string;
  body: string | null;
  chapterName: string | null;
  referenceAnswer: string | null;
  referenceKind: ReferenceKind;
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
