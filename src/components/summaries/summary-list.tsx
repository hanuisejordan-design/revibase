"use client";

import { useMemo, useState } from "react";
import type { SummaryItem } from "@/features/summaries/types";
import { relativeTime } from "@/lib/utils/date";
import { DeleteSummaryButton } from "./delete-summary-button";

const KIND_LABEL: Record<SummaryItem["kind"], string> = {
  pdf: "PDF",
  image: "IMG",
  other: "FICHIER",
};

const NO_CHAPTER = "__none__";

function Row({ summary, courseId }: { summary: SummaryItem; courseId: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {KIND_LABEL[summary.kind]}
      </span>
      <span className="font-medium">{summary.title}</span>
      <span className="text-xs text-zinc-500">
        par {summary.authorName} · {relativeTime(summary.createdAt)}
      </span>
      <span className="ml-auto flex items-center gap-3 text-xs">
        {summary.fileUrl ? (
          <a
            href={summary.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300"
          >
            Ouvrir
          </a>
        ) : (
          <span className="text-zinc-400">indisponible</span>
        )}
        {summary.canDelete ? (
          <DeleteSummaryButton courseId={courseId} summaryId={summary.id} />
        ) : null}
      </span>
    </li>
  );
}

export function SummaryList({
  summaries,
  courseId,
}: {
  summaries: SummaryItem[];
  courseId: string;
}) {
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState("all");

  const chapterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of summaries) {
      const key = s.chapterId ?? NO_CHAPTER;
      if (!seen.has(key)) seen.set(key, s.chapterName ?? "Sans chapitre");
    }
    return [...seen.entries()];
  }, [summaries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter((s) => {
      if (chapter !== "all" && (s.chapterId ?? NO_CHAPTER) !== chapter) return false;
      if (q && !s.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [summaries, query, chapter]);

  if (summaries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun résumé pour l&apos;instant. Ajoute le premier avec le bouton ci-dessus.
      </p>
    );
  }

  // Regroupement par chapitre, dans l'ordre d'apparition.
  const groups = new Map<string, { label: string; items: SummaryItem[] }>();
  for (const s of filtered) {
    const key = s.chapterId ?? NO_CHAPTER;
    if (!groups.has(key)) groups.set(key, { label: s.chapterName ?? "Sans chapitre", items: [] });
    groups.get(key)!.items.push(s);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par titre…"
          className="min-w-[12rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        {chapterOptions.length > 1 ? (
          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">Tous les chapitres</option>
            {chapterOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun résumé ne correspond.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {[...groups.values()].map((g) => (
            <section key={g.label} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                {g.label}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {g.items.map((s) => (
                  <Row key={s.id} summary={s} courseId={courseId} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
