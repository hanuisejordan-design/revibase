"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { createSummaryAction, type SummaryFormState } from "@/features/summaries/actions";
import type { ChapterEntry } from "@/features/chapters/queries";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const BUCKET = "summaries";
const MAX_MB = 20;

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none";

function extOf(name: string): string {
  const raw = name.toLowerCase().split(".").pop() ?? "";
  const clean = raw.replace(/[^a-z0-9]/g, "");
  return clean && clean.length <= 8 ? clean : "bin";
}

export function SummaryUploadForm({
  courseId,
  chapters,
}: {
  courseId: string;
  chapters: ChapterEntry[];
}) {
  const [state, formAction, pending] = useActionState<SummaryFormState | undefined, FormData>(
    createSummaryAction,
    undefined,
  );
  const fileRef = useRef<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current;

    if (!file) {
      setUploadError("Ajoute un fichier.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Fichier trop lourd (max ${MAX_MB} Mo).`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const path = `${courseId}/${crypto.randomUUID()}.${extOf(file.name)}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (error) throw error;
      fd.set("filePath", path);
      fd.set("fileName", file.name);
    } catch {
      setUploading(false);
      setUploadError("Envoi du fichier impossible. Réessaie.");
      return;
    }
    setUploading(false);

    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="courseId" value={courseId} />

      <Field label="Titre" htmlFor="title" error={state?.errors?.title}>
        <Input id="title" name="title" required placeholder="ex. Fiche signalisation — chap. 2" />
      </Field>

      <Field label="Chapitre (optionnel)" htmlFor="chapterId" error={state?.errors?.chapterId}>
        <select id="chapterId" name="chapterId" defaultValue="" className={inputCls}>
          <option value="">— Aucun —</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Fichier</span>
        <input
          type="file"
          accept=".pdf,image/*,.doc,.docx,.odt,.txt,.md"
          required
          onChange={(e) => {
            fileRef.current = e.target.files?.[0] ?? null;
            setUploadError(null);
          }}
          className="file:bg-background hover:file:bg-border dark:file:bg-brand dark:hover:file:bg-brand text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
        />
        <p className="text-muted text-xs">PDF ou image de préférence. Max {MAX_MB} Mo.</p>
      </div>

      {uploadError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      ) : null}
      {state?.errors?.file ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.errors.file}
        </p>
      ) : null}
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || uploading} className="w-fit">
        {uploading ? "Envoi…" : pending ? "Publication…" : "Ajouter le résumé"}
      </Button>
    </form>
  );
}
