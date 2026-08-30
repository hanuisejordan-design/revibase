"use client";

import { useEffect, useMemo, useRef } from "react";

const helpCls = "text-xs text-zinc-500";
const removeCls =
  "text-sm text-red-600 underline hover:text-red-700 disabled:opacity-50 dark:text-red-400";
const fileCls =
  "text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700";
const imgCls =
  "max-h-64 rounded-lg border border-zinc-200 object-contain dark:border-zinc-800";

/**
 * Champ « photo » : à la création, sélection + aperçu local. À l'édition,
 * `existingUrl` affiche la photo actuelle, avec « Remplacer » et « Retirer »
 * (`removed` piloté par `onRemovedChange`). L'upload se fait au submit du
 * parent.
 */
export function QuestionImageField({
  file,
  onChange,
  existingUrl,
  removed,
  onRemovedChange,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  removed?: boolean;
  onRemovedChange?: (removed: boolean) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const showExisting = !!existingUrl && !removed && !file;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Photo (optionnel)</span>

      {file ? (
        <div className="flex flex-col items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview ?? ""} alt="Aperçu" className={imgCls} />
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            disabled={disabled}
            className={removeCls}
          >
            Retirer
          </button>
        </div>
      ) : showExisting ? (
        <div className="flex flex-col items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={existingUrl ?? ""} alt="Photo actuelle" className={imgCls} />
          <div className="flex items-center gap-4">
            <label className="cursor-pointer text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400">
              Remplacer
              <input
                type="file"
                accept="image/*"
                disabled={disabled}
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={() => onRemovedChange?.(true)}
              disabled={disabled}
              className={removeCls}
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null);
            onRemovedChange?.(false);
          }}
          className={fileCls}
        />
      )}
      <p className={helpCls}>
        Utile pour une question à partir d&apos;un signal, d&apos;un panneau, d&apos;un schéma.
        L&apos;image est réduite avant l&apos;envoi.
      </p>
    </div>
  );
}
