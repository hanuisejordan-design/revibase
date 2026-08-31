"use client";

import { useEffect } from "react";
import { applyTheme, isThemePref, THEME_KEY } from "@/lib/theme";

/**
 * Applique la préférence de thème stockée après l'hydratation :
 * - « système » (ou rien) → aucun attribut : la media query CSS pilote, y
 *   compris les changements de thème de l'OS en direct.
 * - « clair » / « sombre » → pose `data-theme` sur <html>.
 *
 * Le SSR ne pose jamais l'attribut, donc pas de décalage d'hydratation. Un
 * bref flash reste possible pour qui a forcé un thème opposé à celui de son
 * OS ; acceptable et sans avertissement console.
 */
export function ThemeWatcher() {
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      stored = null;
    }
    applyTheme(isThemePref(stored) ? stored : "system");
  }, []);
  return null;
}
