"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Masque son contenu sur certaines pages. Sert sur la page de campagne
 * /permis-express : le bandeau de l'offre saisonnière n'y a rien à faire (deux
 * prix d'appel sur le même écran sèmeraient le doute), et l'en-tête et le pied
 * du site y sont remplacés par les siens (components/ExpressCadre).
 */
export default function HorsPages({ chemins, children }: { chemins: string[]; children: ReactNode }) {
  const pathname = usePathname();
  return chemins.includes(pathname) ? null : <>{children}</>;
}
