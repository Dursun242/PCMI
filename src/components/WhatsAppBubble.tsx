"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site, whatsappUrl } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

const iconBubble =
  "flex h-11 w-11 items-center justify-center rounded-full border border-brass/60 bg-forest text-brass-2 shadow-[0_6px_20px_rgba(34,53,44,0.28)] transition-all duration-300 hover:border-brass hover:bg-forest-2 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

/**
 * Cluster de capsules flottantes, ordinateur uniquement (le mobile a la barre
 * fixe) : téléphone et Instagram en petites pastilles rondes, WhatsApp en
 * capsule principale avec libellé. Dans les couleurs du site (vert profond,
 * filet laiton), point vert qui pulse pour dire « ligne ouverte » sur
 * WhatsApp. Elles apparaissent après un début de lecture, pas sur la page
 * contact où les liens sont déjà en évidence.
 */
export default function WhatsAppBubble() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const href = whatsappUrl();
  const eligible = Boolean(href) && pathname !== "/contact" && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [eligible, pathname]);

  if (!eligible) return null;

  return (
    <div
      className={`hidden md:flex fixed bottom-6 right-6 z-30 flex-col items-end gap-3 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {site.phone && (
        <a
          href={`tel:${site.phone.replace(/\s/g, "")}`}
          aria-label={`Appeler le ${site.phone}`}
          onClick={() => trackEvent("phone_click", { source: "bulle_desktop" })}
          className={iconBubble}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.4 6.3.4.2.9.3 1.4.2l1.9-.6c.4-.1.8 0 1.1.3l2.1 1.9c.5.4.5 1.1.1 1.6a4 4 0 0 1-3.7 1.4C10 20.9 3.1 14 2.1 7.7a4 4 0 0 1 1.4-3.7c.5-.4 1.2-.3 1.6.1l1.9 2.1c.3.3.4.7.3 1.1l-.6 1.9c-.1.5 0 1 .2 1.4Z" />
          </svg>
        </a>
      )}
      {site.social.instagram && (
        <a
          href={site.social.instagram}
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="Instagram"
          onClick={() => trackEvent("instagram_click", { source: "bulle_desktop" })}
          className={iconBubble}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </a>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Écrire ou appeler sur WhatsApp"
        onClick={() => trackEvent("whatsapp_click", { source: "bulle_desktop" })}
        className="wa-bubble inline-flex items-center gap-3 rounded-full border border-brass/60 bg-forest pl-4 pr-5 py-2.5 text-paper shadow-[0_6px_20px_rgba(34,53,44,0.28)] transition-all duration-300 hover:border-brass hover:bg-forest-2 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
          <span className="wa-bubble__pulse absolute inset-0 rounded-full bg-[#25d366]" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-[#25d366]" />
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 text-brass-2">
          <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.9-1.3A9.5 9.5 0 1 0 12 2.5Zm0 1.7a7.8 7.8 0 1 1-4 14.5l-.3-.2-2.9.8.8-2.8-.2-.3A7.8 7.8 0 0 1 12 4.2Zm-3 3.9c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3l-1.9-.9c-.3-.1-.5-.2-.7.2l-.9 1.1c-.2.2-.3.2-.6.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.5.5-1l.3-.5c.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4H9Z" />
        </svg>
        <span className="text-[0.9rem] font-bold tracking-[0.01em] whitespace-nowrap">Écrire sur WhatsApp</span>
      </a>
    </div>
  );
}
