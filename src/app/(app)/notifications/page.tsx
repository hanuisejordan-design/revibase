import type { Metadata } from "next";
import Link from "next/link";
import { listNotifications } from "@/features/notifications/queries";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import { MarkAllRead } from "@/components/notifications/mark-all-read";
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
            <button type="submit" className="text-muted text-sm hover:underline">
              Tout marquer comme lu
            </button>
          </form>
        ) : null}
      </div>

      <p className="text-muted text-sm">
        Activer les notifications sur cet appareil :{" "}
        <Link href="/parametres" className="hover:text-foreground underline">
          Paramètres
        </Link>
        .
      </p>

      {notifications.length === 0 ? (
        <p className="text-muted text-sm">Aucune notification.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {notifications.map((n) => {
            const verb =
              n.type === "validation" && n.questionPurpose === "help"
                ? "a validé ton aide sur"
                : VERB[n.type];
            const body = (
              <>
                <span className="font-medium">{n.actorName}</span> {verb}
                {n.questionTitle ? (
                  <>
                    {" "}
                    « <span className="text-muted">{n.questionTitle}</span> »
                  </>
                ) : (
                  " une question"
                )}
                <span className="text-muted ml-2 text-xs">{relativeTime(n.createdAt)}</span>
              </>
            );

            const cls = cn(
              "block rounded-lg border px-3 py-2 text-sm",
              n.isRead ? "border-border" : "border-border bg-background",
            );

            return (
              <li key={n.id}>
                {n.courseId && n.questionId ? (
                  <Link
                    href={`/course/${n.courseId}/questions/${n.questionId}`}
                    className={cn(cls, "hover:border-brand/40")}
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
