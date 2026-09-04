"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, isThemePref, THEME_KEY, type ThemePref } from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

// Événement local pour forcer une relecture dans l'onglet courant (l'événement
// natif `storage` ne se déclenche que dans les AUTRES onglets).
const CHANGED = "revibase:theme-changed";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGED, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGED, cb);
  };
}

function getSnapshot(): ThemePref {
  try {
    const s = localStorage.getItem(THEME_KEY);
    return isThemePref(s) ? s : "system";
  } catch {
    return "system";
  }
}

const getServerSnapshot = (): ThemePref => "system";

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function choose(next: ThemePref) {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // stockage indisponible : le choix ne sera juste pas mémorisé
    }
    applyTheme(next);
    window.dispatchEvent(new Event(CHANGED));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Thème"
      className="border-border inline-flex rounded-lg border p-0.5 text-sm"
    >
      {OPTIONS.map((o) => {
        const active = pref === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.value)}
            className={
              active
                ? "bg-brand text-brand-foreground rounded-md px-3 py-1 font-medium"
                : "text-muted hover:bg-background rounded-md px-3 py-1"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
