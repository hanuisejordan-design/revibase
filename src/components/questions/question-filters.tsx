import Link from "next/link";
import Form from "next/form";
import type { ChapterEntry } from "@/features/chapters/queries";
import type { QuestionSort } from "@/features/questions/schema";
import { cn } from "@/lib/utils/cn";

type Params = { chapter?: string; q?: string; sort: QuestionSort };

const SORT_LABELS: Record<QuestionSort, string> = {
  recent: "Récent",
  unanswered: "Sans réponse",
  popular: "Populaire",
};

function buildQuery(base: Params, override: Partial<Params>): string {
  const merged = { ...base, ...override };
  const sp = new URLSearchParams();
  if (merged.chapter) sp.set("chapter", merged.chapter);
  if (merged.q) sp.set("q", merged.q);
  if (merged.sort && merged.sort !== "recent") sp.set("sort", merged.sort);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
      )}
    >
      {children}
    </Link>
  );
}

export function QuestionFilters({
  courseId,
  chapters,
  params,
  hasUnchaptered,
}: {
  courseId: string;
  chapters: ChapterEntry[];
  params: Params;
  hasUnchaptered: boolean;
}) {
  const basePath = `/course/${courseId}/questions`;
  const url = (o: Partial<Params>) => basePath + buildQuery(params, o);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Chip href={url({ chapter: undefined })} active={!params.chapter}>
          Toutes
        </Chip>
        {chapters.map((ch) => (
          <Chip key={ch.id} href={url({ chapter: ch.id })} active={params.chapter === ch.id}>
            {ch.name}
          </Chip>
        ))}
        {hasUnchaptered ? (
          <Chip href={url({ chapter: "none" })} active={params.chapter === "none"}>
            Sans chapitre
          </Chip>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(SORT_LABELS) as QuestionSort[]).map((s) => (
          <Chip key={s} href={url({ sort: s })} active={params.sort === s}>
            {SORT_LABELS[s]}
          </Chip>
        ))}

        <Form action={basePath} className="ml-auto flex items-center gap-2">
          {params.chapter ? <input type="hidden" name="chapter" value={params.chapter} /> : null}
          {params.sort !== "recent" ? (
            <input type="hidden" name="sort" value={params.sort} />
          ) : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Rechercher…"
            className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Form>
      </div>
    </div>
  );
}
