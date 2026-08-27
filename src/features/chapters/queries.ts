import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface ChapterEntry {
  id: string;
  name: string;
  position: number;
}

/** Chapitres d'une classe, triés par position. */
export const listChapters = cache(async (classId: string): Promise<ChapterEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("id, name, position")
    .eq("class_id", classId)
    .order("position", { ascending: true });

  if (error || !data) return [];

  return data as ChapterEntry[];
});
