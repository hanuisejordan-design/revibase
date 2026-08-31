import type { QuestionPurpose } from "@/constants/app";

export type NotificationType = "answer" | "comment" | "validation" | "new_question";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actorName: string;
  questionId: string | null;
  questionTitle: string | null;
  questionPurpose: QuestionPurpose | null;
  courseId: string | null;
}
