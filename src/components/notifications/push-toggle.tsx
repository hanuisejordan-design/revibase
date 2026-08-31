"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/features/push/actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "busy";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<PushSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!VAPID_PUBLIC_KEY) {
        if (!cancelled) setState("unsupported");
        return;
      }
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        if (!cancelled) setState(isIOS && !standalone ? "ios-install" : "unsupported");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const existing = await reg.pushManager.getSubscription();
        subRef.current = existing;
        if (cancelled) return;
        if (Notification.permission === "denied") setState("denied");
        else setState(existing ? "on" : "off");
      } catch {
        if (!cancelled) setState("unsupported");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const res = await subscribeToPushAction(
        {
          endpoint: json.endpoint ?? "",
          keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
        },
        navigator.userAgent,
      );
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        setError("Enregistrement impossible. Réessaie.");
        setState("off");
        return;
      }
      subRef.current = sub;
      setState("on");
    } catch {
      setError("Activation impossible sur cet appareil.");
      setState("off");
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    setState("busy");
    try {
      let sub = subRef.current;
      if (!sub) {
        const reg = await navigator.serviceWorker.ready;
        sub = await reg.pushManager.getSubscription();
      }
      const endpoint = sub?.endpoint ?? "";
      await sub?.unsubscribe().catch(() => {});
      if (endpoint) await unsubscribeFromPushAction(endpoint);
      subRef.current = null;
      setState("off");
    } catch {
      setState("on");
    }
  }, []);

  const box =
    "rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800";

  if (state === "loading") return null;

  if (state === "unsupported") {
    return (
      <div className={box}>
        <p className="text-zinc-500">
          Les notifications push ne sont pas disponibles sur ce navigateur.
        </p>
      </div>
    );
  }

  if (state === "ios-install") {
    return (
      <div className={box}>
        <p className="font-medium">Notifications sur iPhone / iPad</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Ajoute d&apos;abord Revibase à ton écran d&apos;accueil : bouton Partager{" "}
          <span aria-hidden>⎋</span> puis « Sur l&apos;écran d&apos;accueil ». Rouvre l&apos;app
          depuis l&apos;icône, puis reviens ici pour activer les notifications.
        </p>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className={box}>
        <p className="font-medium">Notifications bloquées</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Tu as refusé les notifications pour ce site. Réautorise-les dans les réglages du
          navigateur ou du téléphone, puis recharge la page.
        </p>
      </div>
    );
  }

  return (
    <div className={`${box} flex flex-wrap items-center justify-between gap-3`}>
      <div>
        <p className="font-medium">Notifications sur cet appareil</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {state === "on"
            ? "Activées — tu recevras une alerte même l'app fermée."
            : "Reçois une alerte quand on répond, commente, valide, ou qu'une nouveauté arrive."}
        </p>
        {error ? <p className="mt-1 text-red-600">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={state === "on" ? disable : enable}
        disabled={state === "busy"}
        className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        {state === "busy" ? "…" : state === "on" ? "Désactiver" : "Activer"}
      </button>
    </div>
  );
}
