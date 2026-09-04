import type { CourseMemberEntry } from "@/features/courses/types";
import { setCourseAdminAction, setCourseTrainerAction } from "@/features/courses/actions";
import { cn } from "@/lib/utils/cn";

const badge = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
const adminBadge = cn(badge, "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300");
const trainerBadge = cn(badge, "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300");

function Toggle({
  action,
  courseId,
  userId,
  on,
  label,
}: {
  action: (fd: FormData) => void;
  courseId: string;
  userId: string;
  on: boolean;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="value" value={on ? "0" : "1"} />
      <button
        type="submit"
        className={cn(
          "rounded-md border px-2 py-0.5 text-xs transition-colors",
          on
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border text-muted hover:border-brand/40",
        )}
      >
        {on ? "✓ " : ""}
        {label}
      </button>
    </form>
  );
}

export function CourseMemberManager({
  courseId,
  members,
  canManage,
}: {
  courseId: string;
  members: CourseMemberEntry[];
  canManage: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {members.map((m) => (
        <li key={m.userId} className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{m.displayName}</span>
          {canManage ? (
            <>
              <Toggle
                action={setCourseAdminAction}
                courseId={courseId}
                userId={m.userId}
                on={m.isAdmin}
                label="Admin"
              />
              <Toggle
                action={setCourseTrainerAction}
                courseId={courseId}
                userId={m.userId}
                on={m.role === "trainer"}
                label="Formateur"
              />
            </>
          ) : (
            <>
              {m.isAdmin ? <span className={adminBadge}>Admin</span> : null}
              {m.role === "trainer" ? <span className={trainerBadge}>Formateur</span> : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
