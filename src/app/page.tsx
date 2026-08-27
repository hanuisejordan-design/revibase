import { APP_NAME, APP_TAGLINE } from "@/constants/app";

const CORE_ACTIONS = [
  {
    title: "Poser une question",
    description: "Une difficulté rencontrée devient un objet permanent, rangé dans un chapitre.",
  },
  {
    title: "Voir les questions",
    description:
      "La bibliothèque des questions de la classe, avec les réponses et les discussions.",
  },
  {
    title: "Faire un quiz",
    description: "Réviser à partir des vraies difficultés rencontrées par la classe.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">{APP_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {APP_TAGLINE}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Une question posée ne se perd pas dans un fil de discussion : elle reste retrouvable,
          discutable et réutilisable pour réviser.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {CORE_ACTIONS.map((action) => (
          <li
            key={action.title}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <h2 className="font-medium">{action.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{action.description}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-zinc-500">
        Projet en cours de construction — Phase 0 : initialisation.
      </p>
    </main>
  );
}
