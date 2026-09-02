import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { countUnreadNotifications } from "@/features/notifications/queries";
import { getMyCourseOptions } from "@/features/courses/queries";
import { BottomNav } from "@/components/nav/bottom-nav";
import { APP_NAME } from "@/constants/app";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, unread, courseOptions] = await Promise.all([
    requireUser(),
    countUnreadNotifications(),
    getMyCourseOptions(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="font-semibold">
            {APP_NAME}
          </Link>
          {/* Sur mobile, cloche + profil sont dans la barre du bas. */}
          <div className="hidden items-center gap-3 text-sm md:flex">
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
            <Link
              href="/parametres"
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {user.displayName} <span aria-hidden>⚙</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pt-8 md:pb-8">
        {children}
      </main>
      <BottomNav unread={unread} courses={courseOptions} />
    </div>
  );
}
