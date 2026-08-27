/** Nom affiché du produit. */
export const APP_NAME = "Revibase";

/** Baseline courte, utilisée sur la page d'accueil et les métadonnées. */
export const APP_TAGLINE = "Les questions de la classe, rangées et réutilisables pour réviser.";

/**
 * Rôle d'un membre AU SEIN d'une classe (et non au niveau du compte).
 * Le créateur d'une classe en devient `trainer`, les autres `student`.
 */
export const CLASS_ROLES = ["student", "trainer"] as const;
export type ClassRole = (typeof CLASS_ROLES)[number];

/**
 * Nature d'une question. `open` = réponse rédigée (cas courant au MVP).
 * `mcq` = choix multiples, prévu pour la Phase 8 (non actif au MVP).
 */
export const QUESTION_KINDS = ["open", "mcq"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

/**
 * Statut d'affichage d'une réponse, par priorité décroissante. Il est
 * calculé à la lecture à partir de : `validated_by` (formateur),
 * `accepted` (auteur de la question) et du nombre de votes.
 */
export const ANSWER_STATUSES = [
  "validated", // validée par un formateur
  "accepted", // retenue par l'auteur de la question
  "community", // réponse la plus votée (votes > 0)
  "unverified", // aucune des conditions ci-dessus
] as const;
export type AnswerStatus = (typeof ANSWER_STATUSES)[number];

/** Mode d'un quiz. `self_assessment` au MVP ; `mcq` réservé à la Phase 8. */
export const QUIZ_MODES = ["self_assessment", "mcq"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];

/** Longueur du code d'invitation d'une classe. */
export const JOIN_CODE_LENGTH = 8;

/** Bornes du générateur de quiz. */
export const QUIZ_MIN_QUESTIONS = 1;
export const QUIZ_MAX_QUESTIONS = 50;
export const QUIZ_DEFAULT_QUESTIONS = 10;

/** Chapitres proposés par défaut à la création d'une classe. */
export const DEFAULT_CHAPTERS = [
  "Signalisation",
  "Réglementation",
  "Matériel",
  "Sécurité",
] as const;
