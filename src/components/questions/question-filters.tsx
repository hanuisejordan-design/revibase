import Link from "next/link";
import Form from "next/form";
import type { ChapterEntry } from "@/features/chapters/queries";
import type { QuestionSort } from "@/features/questions/schema";
import { QUESTION_PURPOSE_SHORT, type QuestionPurpose } from "@/constants/app";
import { cn } from "@/lib/utils/cn";

type Params = { chapter?: string; q?: string; sort: QuestionSort; purpose?: QuestionPurpose };

const SORT_LABELS: Record<QuestionSort, string> = {
  recent: "Récent",
  unanswered: "Sans réponse",
  popular: "Populaire",
};

const PURPOSE_FILTERS: { value: QuestionPurpose | undefined; label: string }[] = [
  { value: undefined, label: "Toutes intentions" },
  { value: "help", label: QUESTION_PURPOSE_SHORT.help },
  { value: "challenge", label: QUESTION_PURPOSE_SHORT.challenge },
];

function buildQuery(base: Params, override: Partial<Params>): string {
  const merged = { ...base, ...override };
  const sp = new URLSearchParams();
  if (merged.chapter) sp.set("chapter", merged.chapter);
  if (merged.q) sp.set("q", merged.q);
  if (merged.sort && merged.sort !== "recent") sp.set("sort", merged.sort);
  if (merged.purpose) sp.set("purpose", merged.purpose);
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
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border hover:border-brand/40",
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

        <Form action={basePath} className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          {params.chapter ? <input type="hidden" name="chapter" value={params.chapter} /> : null}
          {params.sort !== "recent" ? (
            <input type="hidden" name="sort" value={params.sort} />
          ) : null}
          {params.purpose ? <input type="hidden" name="purpose" value={params.purpose} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Rechercher…"
            className="border-border bg-surface focus:border-brand w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none sm:w-40"
          />
        </Form>
      </div>

      <div className="flex flex-wrap gap-2">
        {PURPOSE_FILTERS.map((p) => (
          <Chip
            key={p.value ?? "all"}
            href={url({ purpose: p.value })}
            active={(params.purpose ?? undefined) === p.value}
          >
            {p.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
