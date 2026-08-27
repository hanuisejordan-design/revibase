import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/dal";
import { APP_NAME } from "@/constants/app";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getUser()) redirect("/dashboard");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <Link
        href="/"
        className="text-center text-sm font-medium tracking-wide text-zinc-500 uppercase"
      >
        {APP_NAME}
      </Link>
      {children}
    </div>
  );
}
