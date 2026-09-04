import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { countUnreadNotifications } from "@/features/notifications/queries";
import { getMyCourseOptions } from "@/features/courses/queries";
import { getMyClassOptions } from "@/features/classes/queries";
import { BottomNav } from "@/components/nav/bottom-nav";
import { APP_NAME } from "@/constants/app";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, unread, courseOptions, classOptions] = await Promise.all([
    requireUser(),
    countUnreadNotifications(),
    getMyCourseOptions(),
    getMyClassOptions(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="display text-lg">
            {APP_NAME}
          </Link>
          {/* Sur mobile, cloche + profil sont dans la barre du bas. */}
          <div className="hidden items-center gap-3 text-sm md:flex">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-md p-1.5 text-muted hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
            >
              <Bell size={18} aria-hidden />
              {unread > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              href="/parametres"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
            >
              {user.displayName}
              <Settings size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-8 md:pb-8">
        {children}
      </main>
      <BottomNav unread={unread} courses={courseOptions} classes={classOptions} />
    </div>
  );
}
