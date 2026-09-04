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
      <span className="text-muted text-xs font-semibold tracking-wide uppercase">
        Code d&apos;invitation
      </span>
      <div className="flex items-center gap-3">
        <code className="bg-background rounded-lg px-3 py-1.5 font-mono text-lg tracking-widest">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="text-muted hover:text-foreground text-sm underline"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <p className="text-muted text-sm">{hint}</p>
    </div>
  );
}
