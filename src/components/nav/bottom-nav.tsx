"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CourseOption } from "@/features/courses/queries";
import { CoursesSheet } from "./courses-sheet";
import { CreateSheet } from "./create-sheet";

type Sheet = "courses" | "create" | null;

const itemCls =
  "flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] text-zinc-500 dark:text-zinc-400";
const activeCls = "text-zinc-900 dark:text-zinc-100";

export function BottomNav({
  unread,
  courses,
}: {
  unread: number;
  courses: CourseOption[];
}) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<Sheet>(null);

  const currentCourseId = pathname.match(/^\/course\/([^/]+)/)?.[1] ?? null;
  const isHome = pathname === "/dashboard" || pathname.startsWith("/class/");
  const isCourses = pathname.startsWith("/course/");
  const isNotifs = pathname === "/notifications";
  const isProfil = pathname === "/parametres";

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-stretch">
          <Link
            href="/dashboard"
            className={`${itemCls} ${isHome ? activeCls : ""}`}
            onClick={() => setSheet(null)}
          >
            <span className="text-lg leading-none" aria-hidden>
              🏠
            </span>
            Accueil
          </Link>

          <button
            type="button"
            onClick={() => setSheet(sheet === "courses" ? null : "courses")}
            className={`${itemCls} ${isCourses || sheet === "courses" ? activeCls : ""}`}
          >
            <span className="text-lg leading-none" aria-hidden>
              📚
            </span>
            Cours
          </button>

          <button
            type="button"
            aria-label="Créer"
            onClick={() => setSheet(sheet === "create" ? null : "create")}
            className="flex flex-1 flex-col items-center justify-center py-2"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-2xl leading-none text-white dark:bg-zinc-100 dark:text-zinc-900">
              +
            </span>
          </button>

          <Link
            href="/notifications"
            className={`${itemCls} ${isNotifs ? activeCls : ""}`}
            onClick={() => setSheet(null)}
          >
            <span className="relative text-lg leading-none" aria-hidden>
              🔔
              {unread > 0 ? (
                <span className="absolute -top-1 -right-2 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </span>
            Notifs
          </Link>

          <Link
            href="/parametres"
            className={`${itemCls} ${isProfil ? activeCls : ""}`}
            onClick={() => setSheet(null)}
          >
            <span className="text-lg leading-none" aria-hidden>
              👤
            </span>
            Profil
          </Link>
        </div>
      </nav>

      <CoursesSheet
        open={sheet === "courses"}
        onClose={() => setSheet(null)}
        courses={courses}
      />
      <CreateSheet
        key={sheet === "create" ? "create-open" : "create-closed"}
        open={sheet === "create"}
        onClose={() => setSheet(null)}
        courses={courses}
        currentCourseId={currentCourseId}
      />
    </>
  );
}
