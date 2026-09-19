"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = Omit<ComponentProps<typeof Link>, "onClick"> & {
  /** D'où part le clic : « hero », « plan_card », « sticky_mobile »… */
  source: string;
  /** Formule concernée, quand le lien en porte une. */
  formule?: string;
};

/**
 * Lien d'appel à l'action mesuré (événement `cta_click`).
 * Utilisable depuis un composant serveur : seul ce fichier est côté client.
 */
export default function TrackedLink({ source, formule, children, ...rest }: Props) {
  return (
    <Link {...rest} onClick={() => trackEvent("cta_click", { source, ...(formule ? { formule } : {}) })}>
      {children}
    </Link>
  );
}
