"use client";

import { usePathname, useRouter } from "next/navigation";

/** Case « Mes favoris uniquement » — pilote le paramètre `?favoris=1`. */
export function FavoritesFilter({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <input
        type="checkbox"
        checked={active}
        onChange={(e) => router.push(e.target.checked ? `${pathname}?favoris=1` : pathname)}
      />
      Mes favoris uniquement
    </label>
  );
}
