"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Appel à l'action d'un article de conseils (événement `article_cta_click`).
 * Distinct de TrackedLink : on veut savoir quel article convertit, pas
 * seulement quel emplacement.
 */
export default function ArticleCtaLink({
  slug,
  children,
  href,
  ...rest
}: Omit<ComponentProps<typeof Link>, "onClick"> & { slug: string }) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={() => trackEvent("article_cta_click", { slug, destination: String(href) })}
    >
      {children}
    </Link>
  );
}
