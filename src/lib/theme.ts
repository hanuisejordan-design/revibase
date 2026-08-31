/** Préférence de thème stockée dans `localStorage` sous cette clé. */
export const THEME_KEY = "theme";

export type ThemePref = "system" | "light" | "dark";

export function isThemePref(v: unknown): v is ThemePref {
  return v === "system" || v === "light" || v === "dark";
}

/**
 * Applique une préférence au DOM : « système » retire l'attribut (la media
 * query CSS prend le relais), « clair » / « sombre » le posent sur <html>.
 * Client uniquement.
 */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === "light" || pref === "dark") root.setAttribute("data-theme", pref);
  else root.removeAttribute("data-theme");
}
