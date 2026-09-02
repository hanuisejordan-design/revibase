"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CourseOption } from "@/features/courses/queries";
import type { ClassOption } from "@/features/classes/queries";
import { CoursesSheet } from "./courses-sheet";
import { CreateSheet } from "./create-sheet";
import { HomeSheet } from "./home-sheet";

type Sheet = "home" | "courses" | "create" | null;

const itemCls =
  "flex flex-1 items-center justify-center py-3 text-xl leading-none text-zinc-500 dark:text-zinc-400";
const activeCls = "text-zinc-900 dark:text-zinc-100";

export function BottomNav({
  unread,
  courses,
  classes,
}: {
  unread: number;
  courses: CourseOption[];
  classes: ClassOption[];
}) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<Sheet>(null);

  // « Accueil » = niveau tableau de bord (classes + cours perso) ;
  // « Cours » = les cours situés dans une classe.
  const personalCourses = courses.filter((c) => c.className === null);
  const classCourses = courses.filter((c) => c.className !== null);
  const hasHomeContent = classes.length > 0 || personalCourses.length > 0;

  const currentCourseId = pathname.match(/^\/course\/([^/]+)/)?.[1] ?? null;
  const isHome = pathname === "/dashboard" || pathname.startsWith("/class/");
  const isCourses = pathname.startsWith("/course/");
  const isNotifs = pathname === "/notifications";
  const isProfil = pathname === "/parametres";

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        {/* Onglets répartis, avec une marge pour ne pas coller aux bords. */}
        <div className="mx-auto flex w-full max-w-md items-stretch px-6">
          {hasHomeContent ? (
            <button
              type="button"
              aria-label="Accueil"
              onClick={() => setSheet(sheet === "home" ? null : "home")}
              className={`${itemCls} ${isHome || sheet === "home" ? activeCls : ""}`}
            >
              <span aria-hidden>🏠</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              aria-label="Accueil"
              className={`${itemCls} ${isHome ? activeCls : ""}`}
              onClick={() => setSheet(null)}
            >
              <span aria-hidden>🏠</span>
            </Link>
          )}

          <button
            type="button"
            aria-label="Aller à un cours"
            onClick={() => setSheet(sheet === "courses" ? null : "courses")}
            className={`${itemCls} ${isCourses || sheet === "courses" ? activeCls : ""}`}
          >
            <span aria-hidden>📚</span>
          </button>

          <button
            type="button"
            aria-label="Créer"
            onClick={() => setSheet(sheet === "create" ? null : "create")}
            className="flex flex-1 items-center justify-center py-2"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-2xl leading-none text-white dark:bg-zinc-100 dark:text-zinc-900">
              +
            </span>
          </button>

          <Link
            href="/notifications"
            aria-label="Notifications"
            className={`${itemCls} ${isNotifs ? activeCls : ""}`}
            onClick={() => setSheet(null)}
          >
            <span className="relative" aria-hidden>
              🔔
              {unread > 0 ? (
                <span className="absolute -top-1 -right-2 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </span>
          </Link>

          <Link
            href="/parametres"
            aria-label="Profil"
            className={`${itemCls} ${isProfil ? activeCls : ""}`}
            onClick={() => setSheet(null)}
          >
            <span aria-hidden>👤</span>
          </Link>
        </div>
      </nav>

      <HomeSheet
        open={sheet === "home"}
        onClose={() => setSheet(null)}
        classes={classes}
        personalCourses={personalCourses}
      />
      <CoursesSheet
        open={sheet === "courses"}
        onClose={() => setSheet(null)}
        courses={classCourses}
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
