import "server-only";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@revibase.app";

let configured = false;

/** Configure `web-push` à la première utilisation. `false` si pas de clés VAPID. */
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

/** Le push est-il configuré sur ce déploiement ? */
export function pushConfigured(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  /** Chemin ouvert au clic sur la notification. */
  url: string;
}

/**
 * Best-effort : envoie une notification push aux appareils des utilisateurs
 * donnés. Ne lève jamais — la notification in-app (écrite par les triggers)
 * reste la source de vérité ; le push n'est qu'une couche de livraison.
 * Les abonnements périmés (404/410) sont purgés au passage.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  const targets = [...new Set(userIds.filter(Boolean))];
  if (targets.length === 0 || !ensureConfigured()) return;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_push_targets", { p_user_ids: targets });
    if (error || !data) return;

    const subs = data as Array<{ endpoint: string; p256dh: string; auth: string }>;
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number } | null)?.statusCode;
          if (code === 404 || code === 410) {
            await supabase.rpc("delete_push_subscription_by_endpoint", { p_endpoint: s.endpoint });
          }
        }
      }),
    );
  } catch {
    // best-effort : on n'interrompt jamais l'action pour un échec de push.
  }
}
