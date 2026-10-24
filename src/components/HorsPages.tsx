"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Masque son contenu sur certaines pages. Sert au bandeau de l'offre
 * saisonnière, qui n'a rien à faire sur la page de campagne /permis-express
 * (deux prix d'appel différents sur le même écran sèmeraient le doute).
 */
export default function HorsPages({ chemins, children }: { chemins: string[]; children: ReactNode }) {
  const pathname = usePathname();
  return chemins.includes(pathname) ? null : <>{children}</>;
}
