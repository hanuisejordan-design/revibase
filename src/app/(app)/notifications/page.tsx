import type { Metadata } from "next";
import Link from "next/link";
import { listNotifications } from "@/features/notifications/queries";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import { MarkAllRead } from "@/components/notifications/mark-all-read";
import { PushToggle } from "@/components/notifications/push-toggle";
import { relativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { NotificationType } from "@/features/notifications/types";

export const metadata: Metadata = { title: "Notifications" };

const VERB: Record<NotificationType, string> = {
  answer: "a répondu à",
  comment: "a commenté",
  validation: "a validé ta réponse à",
  new_question: "a posé la question",
};

export default async function NotificationsPage() {
  const notifications = await listNotifications();
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-6">
      <MarkAllRead />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {hasUnread ? (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              Tout marquer comme lu
            </button>
          </form>
        ) : null}
      </div>

      <PushToggle />

      {notifications.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune notification.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {notifications.map((n) => {
            const body = (
              <>
                <span className="font-medium">{n.actorName}</span> {VERB[n.type]}
                {n.questionTitle ? (
                  <>
                    {" "}
                    « <span className="text-zinc-700 dark:text-zinc-300">{n.questionTitle}</span> »
                  </>
                ) : (
                  " une question"
                )}
                <span className="ml-2 text-xs text-zinc-500">{relativeTime(n.createdAt)}</span>
              </>
            );

            const cls = cn(
              "block rounded-lg border px-3 py-2 text-sm",
              n.isRead
                ? "border-zinc-200 dark:border-zinc-800"
                : "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900",
            );

            return (
              <li key={n.id}>
                {n.courseId && n.questionId ? (
                  <Link
                    href={`/course/${n.courseId}/questions/${n.questionId}`}
                    className={cn(cls, "hover:border-zinc-400 dark:hover:border-zinc-600")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
