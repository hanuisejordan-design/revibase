"use client";

import { leaveCourseAction } from "@/features/courses/actions";

export function LeaveCourseButton({ courseId }: { courseId: string }) {
  return (
    <form
      action={leaveCourseAction}
      onSubmit={(e) => {
        if (!confirm("Quitter ce cours ? Tu pourras la rejoindre à nouveau avec le code.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Quitter le cours
      </button>
    </form>
  );
}
