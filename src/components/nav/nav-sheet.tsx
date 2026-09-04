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
      <div className="border-border bg-surface absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="border-border bg-surface sticky top-0 flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:bg-background rounded-md px-2 py-1 text-sm"
          >
            Fermer
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
