"use client";

import { useActionState, useState } from "react";
import { createQuestionAction, type QuestionFormState } from "@/features/questions/actions";
import type { ChapterEntry } from "@/features/chapters/queries";
import {
  MCQ_MAX_OPTIONS,
  QUESTION_KINDS,
  QUESTION_KIND_LABELS,
  type QuestionKind,
} from "@/constants/app";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type McqOption = { body: string; correct: boolean };

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950";

export function CreateQuestionForm({
  classId,
  chapters,
  defaultChapterId,
}: {
  classId: string;
  chapters: ChapterEntry[];
  defaultChapterId?: string;
}) {
  const [state, formAction, pending] = useActionState<QuestionFormState | undefined, FormData>(
    createQuestionAction,
    undefined,
  );

  const [kind, setKind] = useState<QuestionKind>("open");
  const [tf, setTf] = useState<"true" | "false" | "">("");
  const [options, setOptions] = useState<McqOption[]>([
    { body: "", correct: false },
    { body: "", correct: false },
  ]);

  let optionsPayload: { body: string; isCorrect: boolean }[] = [];
  if (kind === "true_false") {
    optionsPayload = [
      { body: "Vrai", isCorrect: tf === "true" },
      { body: "Faux", isCorrect: tf === "false" },
    ];
  } else if (kind === "mcq") {
    optionsPayload = options.map((o) => ({ body: o.body, isCorrect: o.correct }));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="optionsJson" value={JSON.stringify(optionsPayload)} />

      <Field label="Type" htmlFor="kind-select">
        <select
          id="kind-select"
          value={kind}
          onChange={(e) => setKind(e.target.value as QuestionKind)}
          className={inputCls}
        >
          {QUESTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {QUESTION_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Chapitre" htmlFor="chapterId" error={state?.errors?.chapterId}>
        <select
          id="chapterId"
          name="chapterId"
          defaultValue={defaultChapterId ?? ""}
          className={inputCls}
        >
          <option value="" disabled>
            — Choisir un chapitre —
          </option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={kind === "true_false" ? "Affirmation" : "Question"}
        htmlFor="title"
        error={state?.errors?.title}
      >
        <Input
          id="title"
          name="title"
          required
          autoFocus
          placeholder={
            kind === "true_false"
              ? "Une phrase à juger vraie ou fausse"
              : "Formule ta question en une phrase"
          }
        />
      </Field>

      {kind === "true_false" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">La bonne réponse</legend>
          <div className="flex gap-4 text-sm">
            {(["true", "false"] as const).map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="tf" checked={tf === v} onChange={() => setTf(v)} />
                {v === "true" ? "Vrai" : "Faux"}
              </label>
            ))}
          </div>
          {state?.errors?.options ? (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.options}</p>
          ) : null}
        </fieldset>
      ) : null}

      {kind === "mcq" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Options (coche la bonne)</legend>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="mcq-correct"
                checked={opt.correct}
                onChange={() =>
                  setOptions((prev) => prev.map((o, j) => ({ ...o, correct: j === i })))
                }
                aria-label={`Option ${i + 1} correcte`}
              />
              <input
                value={opt.body}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, j) => (j === i ? { ...o, body: e.target.value } : o)),
                  )
                }
                placeholder={`Option ${i + 1}`}
                className={inputCls}
              />
              {options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Retirer l'option"
                  className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          {options.length < MCQ_MAX_OPTIONS ? (
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, { body: "", correct: false }])}
              className="w-fit text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400"
            >
              + Ajouter une option
            </button>
          ) : null}
          {state?.errors?.options ? (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.options}</p>
          ) : null}
        </fieldset>
      ) : null}

      <Field label="Contexte / détails (optionnel)" htmlFor="body" error={state?.errors?.body}>
        <textarea
          id="body"
          name="body"
          rows={4}
          placeholder="Le contexte, une précision sur la situation…"
          className={inputCls}
        />
      </Field>

      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Publication…" : "Publier"}
      </Button>
    </form>
  );
}
