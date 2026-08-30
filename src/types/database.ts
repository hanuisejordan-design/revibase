/**
 * Types de domaine partagés.
 *
 * À terme, ces types seront (re)générés depuis le schéma Supabase :
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * En attendant la Phase 1, on maintient ici une version écrite à la main,
 * alignée sur `supabase/migrations/0001_initial_schema.sql`.
 */

import type { CourseRole, QuestionKind, QuizMode } from "@/constants/app";

export type UUID = string;
export type ISODateString = string;

export interface Profile {
  id: UUID;
  display_name: string;
  created_at: ISODateString;
}

export interface ClassRoom {
  id: UUID;
  name: string;
  join_code: string;
  created_by: UUID;
  created_at: ISODateString;
}

export interface ClassMember {
  id: UUID;
  course_id: UUID;
  user_id: UUID;
  role: CourseRole;
  joined_at: ISODateString;
}

export interface Chapter {
  id: UUID;
  course_id: UUID;
  name: string;
  position: number;
  created_at: ISODateString;
}

export interface Question {
  id: UUID;
  course_id: UUID;
  chapter_id: UUID | null;
  author_id: UUID;
  kind: QuestionKind;
  title: string;
  body: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

export interface Answer {
  id: UUID;
  question_id: UUID;
  author_id: UUID;
  body: string;
  accepted: boolean;
  validated_by: UUID | null;
  validated_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface AnswerVote {
  id: UUID;
  answer_id: UUID;
  user_id: UUID;
  created_at: ISODateString;
}

export interface DiscussionComment {
  id: UUID;
  question_id: UUID;
  author_id: UUID;
  body: string;
  created_at: ISODateString;
}

/** Prévu pour les questions `mcq` (Phase 8). Non utilisé au MVP. */
export interface QuestionOption {
  id: UUID;
  question_id: UUID;
  body: string;
  is_correct: boolean;
  position: number;
}

export interface Quiz {
  id: UUID;
  course_id: UUID;
  created_by: UUID;
  chapter_id: UUID | null;
  requested_count: number;
  mode: QuizMode;
  created_at: ISODateString;
}

export interface QuizQuestion {
  id: UUID;
  quiz_id: UUID;
  question_id: UUID;
  position: number;
}

export interface QuizAttempt {
  id: UUID;
  quiz_id: UUID;
  user_id: UUID;
  score: number | null;
  total: number | null;
  started_at: ISODateString;
  completed_at: ISODateString | null;
}

export interface QuizAnswer {
  id: UUID;
  attempt_id: UUID;
  quiz_question_id: UUID;
  knew_it: boolean | null;
  selected_answer_id: UUID | null;
  is_correct: boolean | null;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: "answer" | "comment" | "validation" | "new_question";
  question_id: UUID | null;
  actor_id: UUID | null;
  read_at: ISODateString | null;
  created_at: ISODateString;
}
