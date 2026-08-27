const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

/** « il y a 2 jours », « à l'instant »… à partir d'une date ISO. */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const month = Math.round(day / 30);
  const year = Math.round(day / 365);

  if (Math.abs(sec) < 45) return "à l'instant";
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
  if (Math.abs(day) < 30) return rtf.format(-day, "day");
  if (Math.abs(month) < 12) return rtf.format(-month, "month");
  return rtf.format(-year, "year");
}
