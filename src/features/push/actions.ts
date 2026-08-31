"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Enregistre (ou rafraîchit) l'abonnement push de l'appareil courant. */
export async function subscribeToPushAction(
  sub: PushSubscriptionInput,
  userAgent?: string,
): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user) return { ok: false };
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent?.slice(0, 400) ?? null,
    },
    { onConflict: "endpoint" },
  );

  return { ok: !error };
}

/** Supprime l'abonnement de l'appareil courant (désactivation). */
export async function unsubscribeFromPushAction(endpoint: string): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user || !endpoint) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return { ok: !error };
}
