import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { getMyClasses } from "@/features/classes/queries";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { PushToggle } from "@/components/notifications/push-toggle";
import { InviteCode } from "@/components/courses/invite-code";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Paramètres" };

const section = "flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800";
const heading = "text-xs font-semibold tracking-wide text-zinc-500 uppercase";

export default async function SettingsPage() {
  const [user, classes] = await Promise.all([requireUser(), getMyClasses()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Paramètres</h1>

      <section className={section}>
        <span className={heading}>Thème</span>
        <ThemeToggle />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          « Système » suit le réglage de ton téléphone ou de ton ordinateur.
        </p>
      </section>

      <section className={section}>
        <span className={heading}>Notifications</span>
        <PushToggle />
      </section>

      <section className={section}>
        <span className={heading}>Mes codes d&apos;invitation</span>
        {classes.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {classes.map((cl) => (
              <li key={cl.id}>
                <p className="mb-1 text-sm font-medium">{cl.name}</p>
                <InviteCode
                  code={cl.joinCode}
                  hint="Ce code fait entrer quelqu'un dans la classe (accès à tous ses cours)."
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tu n&apos;es dans aucune classe pour l&apos;instant.
          </p>
        )}
      </section>

      <section className={section}>
        <span className={heading}>Compte</span>
        <p className="text-sm">
          {user.displayName}
          {user.email ? (
            <span className="text-zinc-500 dark:text-zinc-400"> · {user.email}</span>
          ) : null}
        </p>
        <div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
