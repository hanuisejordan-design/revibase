import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { APP_NAME } from "@/constants/app";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{user.displayName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
