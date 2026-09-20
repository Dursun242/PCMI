"use client";

import type { ReactNode } from "react";
import { whatsappUrl } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

/**
 * Lien vers la conversation WhatsApp du maître d'œuvre, mesuré
 * (événement `whatsapp_click`). Ne rend rien si le téléphone est masqué.
 * Sur mobile, wa.me ouvre l'application ; sur ordinateur, WhatsApp Web.
 */
export default function WhatsAppLink({
  source,
  className = "",
  children,
  text,
  iconOnly = false,
  noIcon = false,
}: {
  source: string;
  className?: string;
  children?: ReactNode;
  /** Message pré-rempli dans la conversation. */
  text?: string;
  iconOnly?: boolean;
  /** Lien en ligne dans une phrase : pas d'icône, pas de flex. */
  noIcon?: boolean;
}) {
  const href = whatsappUrl(text);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={iconOnly ? "Écrire sur WhatsApp" : undefined}
      className={`${noIcon ? "" : "inline-flex items-center gap-2"} ${className}`}
      onClick={() => trackEvent("whatsapp_click", { source })}
    >
      {!noIcon && (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" strokeLinejoin="round" />
        <path d="M9.2 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.2-.1.3 0 .5a6 6 0 0 0 2.8 2.7c.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .5-.2 1.2-.6 1.5-.5.4-1.1.6-1.8.5-2.9-.5-5.4-3-5.9-5.9-.1-.7.1-1.4.5-1.9Z" fill="currentColor" stroke="none" />
      </svg>
      )}
      {!iconOnly && (children ?? "WhatsApp")}
    </a>
  );
}
