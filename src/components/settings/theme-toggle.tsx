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
      className="inline-flex rounded-lg border border-zinc-300 p-0.5 text-sm dark:border-zinc-700"
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
                ? "rounded-md bg-zinc-900 px-3 py-1 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded-md px-3 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
