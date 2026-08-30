"use client";

import { leaveClassAction } from "@/features/classes/actions";

export function LeaveClassButton({ classId }: { classId: string }) {
  return (
    <form
      action={leaveClassAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Quitter cette classe ? Tu perdras l'accès à ses cours (sauf ceux que tu as rejoints par leur propre code).",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="classId" value={classId} />
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Quitter la classe
      </button>
    </form>
  );
}
