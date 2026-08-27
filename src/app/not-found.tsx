import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">Page introuvable</p>
      <h1 className="text-2xl font-semibold">Rien ici</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Cette page n&apos;existe pas, ou tu n&apos;y as pas accès.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
