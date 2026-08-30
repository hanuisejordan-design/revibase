"use client";

import { useActionState } from "react";
import {
  deleteChapterAction,
  moveChapterAction,
  renameChapterAction,
  type ChapterFormState,
} from "@/features/chapters/actions";
import type { ChapterEntry } from "@/features/chapters/queries";
import { Input } from "@/components/ui/input";

function IconButton({
  action,
  courseId,
  chapterId,
  direction,
  disabled,
  label,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  courseId: string;
  chapterId: string;
  direction?: "up" | "down";
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="chapterId" value={chapterId} />
      {direction ? <input type="hidden" name="direction" value={direction} /> : null}
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        className="rounded-md px-1.5 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        {children}
      </button>
    </form>
  );
}

function ChapterRow({
  chapter,
  courseId,
  isFirst,
  isLast,
}: {
  chapter: ChapterEntry;
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, renameAction, pending] = useActionState<ChapterFormState | undefined, FormData>(
    renameChapterAction,
    undefined,
  );

  return (
    <li className="flex flex-col gap-1 border-b border-zinc-200 py-2 last:border-b-0 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <IconButton
            action={moveChapterAction}
            courseId={courseId}
            chapterId={chapter.id}
            direction="up"
            disabled={isFirst}
            label="Monter"
          >
            ↑
          </IconButton>
          <IconButton
            action={moveChapterAction}
            courseId={courseId}
            chapterId={chapter.id}
            direction="down"
            disabled={isLast}
            label="Descendre"
          >
            ↓
          </IconButton>
        </div>

        <form action={renameAction} className="flex flex-1 items-center gap-2" noValidate>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="chapterId" value={chapter.id} />
          <Input name="name" defaultValue={chapter.name} required className="flex-1" />
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-zinc-600 underline hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Renommer
          </button>
        </form>

        <form
          action={deleteChapterAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `Supprimer le chapitre « ${chapter.name} » ? Ses questions ne seront pas supprimées mais se retrouveront sans chapitre.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="chapterId" value={chapter.id} />
          <button
            type="submit"
            className="text-sm text-red-600 underline hover:text-red-700 dark:text-red-400"
          >
            Supprimer
          </button>
        </form>
      </div>

      {state?.errors?.name ? (
        <p className="pl-8 text-sm text-red-600 dark:text-red-400">{state.errors.name}</p>
      ) : null}
      {state?.formError ? (
        <p role="alert" className="pl-8 text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
    </li>
  );
}

export function ChapterListEditor({
  courseId,
  chapters,
}: {
  courseId: string;
  chapters: ChapterEntry[];
}) {
  if (chapters.length === 0) {
    return <p className="text-sm text-zinc-500">Aucun chapitre pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col">
      {chapters.map((chapter, i) => (
        <ChapterRow
          key={chapter.id}
          chapter={chapter}
          courseId={courseId}
          isFirst={i === 0}
          isLast={i === chapters.length - 1}
        />
      ))}
    </ul>
  );
}
