"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Champ « photo » du formulaire de question : sélection d'un fichier image,
 * aperçu local (aucun envoi ici — l'upload se fait à la publication), bouton
 * pour retirer. Le parent garde le `File` et l'envoie au moment du submit.
 */
export function QuestionImageField({
  file,
  onChange,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Photo (optionnel)</span>

      {preview ? (
        <div className="flex flex-col items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Aperçu"
            className="max-h-64 rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
          />
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="text-sm text-red-600 underline hover:text-red-700 disabled:opacity-50 dark:text-red-400"
          >
            Retirer la photo
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700"
        />
      )}
      <p className="text-xs text-zinc-500">
        Utile pour une question à partir d&apos;un signal, d&apos;un panneau, d&apos;un schéma.
        L&apos;image est réduite avant l&apos;envoi.
      </p>
    </div>
  );
}
