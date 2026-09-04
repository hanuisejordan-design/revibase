"use client";

import { startTransition, useActionState, useState } from "react";
import {
  createQuestionAction,
  updateQuestionAction,
  type QuestionFormState,
} from "@/features/questions/actions";
import type { ChapterEntry } from "@/features/chapters/queries";
import {
  MCQ_MAX_OPTIONS,
  QUESTION_KINDS,
  QUESTION_KIND_LABELS,
  QUESTION_PURPOSES,
  QUESTION_PURPOSE_LABELS,
  type QuestionKind,
  type QuestionPurpose,
} from "@/constants/app";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage } from "@/lib/images/downscale";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { QuestionImageField } from "./question-image-field";

const IMAGE_BUCKET = "question-images";

type McqOption = { body: string; correct: boolean };

export type QuestionFormInitial = {
  questionId: string;
  kind: QuestionKind;
  purpose: QuestionPurpose;
  title: string;
  body: string | null;
  chapterId: string | null;
  options: { body: string; isCorrect: boolean }[];
  imageUrl: string | null;
};

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none";

function initialOptions(initial?: QuestionFormInitial): McqOption[] {
  if (initial && initial.kind === "mcq" && initial.options.length > 0) {
    return initial.options.map((o) => ({ body: o.body, correct: o.isCorrect }));
  }
  return [
    { body: "", correct: false },
    { body: "", correct: false },
  ];
}

function initialTf(initial?: QuestionFormInitial): "true" | "false" | "" {
  if (!initial || initial.kind !== "true_false") return "";
  const correct = initial.options.find((o) => o.isCorrect);
  if (correct?.body === "Vrai") return "true";
  if (correct?.body === "Faux") return "false";
  return "";
}

export function QuestionForm({
  courseId,
  chapters,
  defaultChapterId,
  initial,
}: {
  courseId: string;
  chapters: ChapterEntry[];
  defaultChapterId?: string;
  initial?: QuestionFormInitial;
}) {
  const isEdit = Boolean(initial);
  const [state, formAction, pending] = useActionState<QuestionFormState | undefined, FormData>(
    isEdit ? updateQuestionAction : createQuestionAction,
    undefined,
  );

  const [kind, setKind] = useState<QuestionKind>(initial?.kind ?? "open");
  const [tf, setTf] = useState<"true" | "false" | "">(initialTf(initial));
  const [options, setOptions] = useState<McqOption[]>(initialOptions(initial));
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (image) {
      setUploading(true);
      setUploadError(null);
      try {
        const blob = await downscaleImage(image);
        const supabase = createClient();
        const path = `${courseId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
        formData.set("imagePath", path);
      } catch {
        setUploading(false);
        setUploadError("Envoi de la photo impossible. Réessaie, ou publie sans photo.");
        return;
      }
      setUploading(false);
    } else if (removeImage) {
      formData.set("removeImage", "1");
    }

    startTransition(() => formAction(formData));
  }

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="optionsJson" value={JSON.stringify(optionsPayload)} />
      {initial ? <input type="hidden" name="questionId" value={initial.questionId} /> : null}

      <Field label="Type" htmlFor="kind-select">
        {isEdit ? (
          <p id="kind-select" className="text-muted text-sm">
            {QUESTION_KIND_LABELS[kind]} <span className="text-muted">(non modifiable)</span>
          </p>
        ) : (
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
        )}
      </Field>

      <Field label="Pourquoi cette question ?" htmlFor="purpose">
        <select
          id="purpose"
          name="purpose"
          defaultValue={initial?.purpose ?? "help"}
          className={inputCls}
        >
          {QUESTION_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {QUESTION_PURPOSE_LABELS[p]}
            </option>
          ))}
        </select>
        <p className="text-muted mt-1 text-xs">
          « Défi » = tu connais la réponse, c&apos;est pour entraîner les autres et nourrir les
          quiz.
        </p>
      </Field>

      <Field label="Chapitre" htmlFor="chapterId" error={state?.errors?.chapterId}>
        <select
          id="chapterId"
          name="chapterId"
          defaultValue={initial?.chapterId ?? defaultChapterId ?? ""}
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
          defaultValue={initial?.title ?? ""}
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
                  className="text-muted hover:bg-background rounded-md px-2 py-1"
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
              className="text-muted hover:text-foreground w-fit text-sm underline"
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
          defaultValue={initial?.body ?? ""}
          placeholder="Le contexte, une précision sur la situation…"
          className={inputCls}
        />
      </Field>

      <QuestionImageField
        file={image}
        onChange={setImage}
        existingUrl={initial?.imageUrl ?? null}
        removed={removeImage}
        onRemovedChange={setRemoveImage}
        disabled={pending || uploading}
      />

      {uploadError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      ) : null}
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || uploading}>
        {uploading
          ? "Envoi de la photo…"
          : pending
            ? isEdit
              ? "Enregistrement…"
              : "Publication…"
            : isEdit
              ? "Enregistrer"
              : "Publier"}
      </Button>
    </form>
  );
}
