"use client";

import { useEffect, type ReactNode } from "react";

/** Feuille qui remonte depuis la barre du bas (mobile). */
export function NavSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] dark:border-zinc-800 dark:bg-zinc-950">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
          <span className="text-sm font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Fermer
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
