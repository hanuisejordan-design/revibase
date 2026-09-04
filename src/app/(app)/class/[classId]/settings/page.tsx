import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassContext, getClassMembers } from "@/features/classes/queries";
import { LeaveClassButton } from "@/components/classes/leave-class-button";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const ctx = await getClassContext(classId);
  if (!ctx) notFound();

  const members = await getClassMembers(classId);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-muted text-sm">
        Le code d&apos;invitation est dans{" "}
        <Link href="/parametres" className="underline">
          Paramètres
        </Link>
        .
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
          Membres ({members.length})
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2">
              <span>{m.displayName}</span>
              {m.isAdmin ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Admin
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {!ctx.isAdmin ? (
        <section className="border-border border-t pt-4">
          <LeaveClassButton classId={ctx.id} />
        </section>
      ) : null}
    </div>
  );
}
