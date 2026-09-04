import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";

const CORE_ACTIONS = [
  {
    title: "Poser une question",
    description:
      "Une difficulté rencontrée devient un objet permanent, rangé dans un chapitre du cours.",
  },
  {
    title: "Répondre, discuter, valider",
    description:
      "Les autres répondent, on en débat dans un fil rattaché à la question, une réponse est retenue.",
  },
  {
    title: "Réviser",
    description:
      "Quiz auto-corrigés à partir des vraies questions du cours, plus les fiches et résumés partagés.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-muted text-sm font-medium tracking-wide uppercase">{APP_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {APP_TAGLINE}
        </h1>
        <p className="text-muted">
          Une question posée ne se perd pas dans un fil de discussion : elle devient un objet
          permanent, rangé par chapitre, retrouvable et réutilisable pour réviser.
        </p>
        <p className="text-muted text-sm">
          Une <strong>classe</strong> (ta promo) regroupe des <strong>cours</strong> ; chaque cours
          a ses chapitres, ses questions, ses fiches et ses quiz.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {CORE_ACTIONS.map((action) => (
          <li key={action.title} className="border-border rounded-xl border p-5">
            <h2 className="font-medium">{action.title}</h2>
            <p className="text-muted mt-1 text-sm">{action.description}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/register"
          className="bg-brand text-brand-foreground hover:bg-brand-hover inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="border-border hover:bg-background inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Se connecter
        </Link>
      </div>

      <p className="text-muted text-sm">
        Outil de révision communautaire, qui évolue avec les retours de la classe.
      </p>
    </main>
  );
}
