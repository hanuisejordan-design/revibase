"use client";

import { leaveGroupAction } from "@/features/groups/actions";

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  return (
    <form
      action={leaveGroupAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Quitter ce groupe ? Tu perdras l'accès à ses classes (sauf celles que tu as rejointes par leur propre code).",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:text-red-700 dark:text-red-400"
      >
        Quitter le groupe
      </button>
    </form>
  );
}
