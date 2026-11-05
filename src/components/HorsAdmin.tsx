"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Masque son contenu dans l'espace admin : le bandeau de l'offre, l'en-tête et
 * le pied de page du site public n'ont rien à faire dans un outil de gestion,
 * qui a sa propre barre (AdminShell).
 */
export default function HorsAdmin({ children }: { children: ReactNode }) {
  return usePathname().startsWith("/admin") ? null : <>{children}</>;
}
