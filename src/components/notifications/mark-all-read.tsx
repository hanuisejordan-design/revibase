"use client";

import { useEffect } from "react";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";

/**
 * Ouvrir la page = marquer tout lu. Le rendu initial (côté serveur) garde
 * l'état non-lu pour la teinte ; l'effet vide côté base pour la prochaine
 * navigation (cloche à zéro).
 */
export function MarkAllRead() {
  useEffect(() => {
    markAllNotificationsReadAction().catch(() => {});
  }, []);
  return null;
}
