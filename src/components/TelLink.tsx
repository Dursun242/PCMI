"use client";

import type { ReactNode } from "react";
import { site } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

type Props = { source: string; className?: string; children?: ReactNode };

/** Lien d'appel vers le portable, mesuré (événement `tel_click`). Rien si le téléphone est masqué. */
export default function TelLink({ source, className = "", children }: Props) {
  if (!site.phone) return null;
  const href = `tel:+33${site.phone.replace(/\D/g, "").replace(/^0/, "")}`;
  return (
    <a href={href} className={className} onClick={() => trackEvent("tel_click", { source })}>
      {children ?? site.phone}
    </a>
  );
}
