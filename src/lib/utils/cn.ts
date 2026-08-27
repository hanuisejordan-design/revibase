import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatène des classes CSS conditionnelles (clsx) puis résout les conflits
 * d'utilitaires Tailwind (tailwind-merge). À utiliser dans tous les composants.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
