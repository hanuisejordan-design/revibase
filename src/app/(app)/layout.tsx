import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { countUnreadNotifications } from "@/features/notifications/queries";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { APP_NAME } from "@/constants/app";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, unread] = await Promise.all([requireUser(), countUnreadNotifications()]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-md px-1 py-0.5 text-lg leading-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span aria-hidden>🔔</span>
              {unread > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <span className="text-zinc-600 dark:text-zinc-400">{user.displayName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
