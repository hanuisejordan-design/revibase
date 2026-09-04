import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-muted text-sm font-medium tracking-wide uppercase">Page introuvable</p>
      <h1 className="text-2xl font-semibold">Rien ici</h1>
      <p className="text-muted">Cette page n&apos;existe pas, ou tu n&apos;y as pas accès.</p>
      <Link
        href="/dashboard"
        className="bg-brand text-brand-foreground hover:bg-brand-hover inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
