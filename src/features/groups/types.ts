import type { ClassSummary } from "@/features/classes/types";

/** Un groupe tel qu'affiché sur le tableau de bord, avec ses classes. */
export interface GroupSummary {
  id: string;
  name: string;
  joinCode: string;
  /** L'utilisateur courant administre-t-il ce groupe ? */
  isAdmin: boolean;
  classes: ClassSummary[];
}

/** Contexte du groupe courant (pages `group/[groupId]`). */
export interface GroupContext {
  id: string;
  name: string;
  joinCode: string;
  isAdmin: boolean;
}

/** Un membre d'un groupe, pour la liste des participants. */
export interface GroupMemberEntry {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  joinedAt: string;
}
