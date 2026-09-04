"use client";

import { signOutAction } from "@/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-muted hover:text-foreground rounded-md px-2 py-1 underline"
      >
        Se déconnecter
      </button>
    </form>
  );
}
