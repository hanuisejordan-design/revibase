import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { QuestionPurpose } from "@/constants/app";
import type { NotificationItem, NotificationType } from "./types";

type Row = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  actor: { display_name: string } | null;
  questions: { id: string; title: string; course_id: string; purpose: QuestionPurpose } | null;
};

/** Notifications de l'utilisateur courant, les plus récentes d'abord. */
export const listNotifications = cache(async (): Promise<NotificationItem[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, read_at, created_at, actor:profiles!notifications_actor_id_fkey(display_name), questions(id, title, course_id, purpose)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    type: r.type,
    isRead: r.read_at !== null,
    createdAt: r.created_at,
    actorName: r.actor?.display_name ?? "Quelqu'un",
    questionId: r.questions?.id ?? null,
    questionTitle: r.questions?.title ?? null,
    questionPurpose: r.questions?.purpose ?? null,
    courseId: r.questions?.course_id ?? null,
  }));
});

/** Nombre de notifications non lues (pour la cloche). */
export const countUnreadNotifications = cache(async (): Promise<number> => {
  const user = await getUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
});
