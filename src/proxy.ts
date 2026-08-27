import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy Next.js (anciennement « middleware »). S'exécute avant chaque requête
 * pour maintenir la session Supabase à jour dans les cookies.
 *
 * Ce n'est PAS la protection des routes : les gardes se font au plus près des
 * données (`requireUser()` dans les layouts, RLS en base).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - les fichiers statiques Next (_next/static, _next/image)
     * - les fichiers d'assets courants (svg, png, jpg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
