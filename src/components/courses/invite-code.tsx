"use client";

import { useState } from "react";

export function InviteCode({
  code,
  hint = "Partage ce code pour que tes camarades rejoignent le cours.",
}: {
  code: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : l'utilisateur peut copier à la main.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        Code d&apos;invitation
      </span>
      <div className="flex items-center gap-3">
        <code className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono text-lg tracking-widest dark:bg-zinc-800">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{hint}</p>
    </div>
  );
}
