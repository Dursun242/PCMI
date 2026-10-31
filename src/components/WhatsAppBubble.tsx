"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { whatsappUrl } from "@/config/site";
import { estTunnelCommande } from "@/lib/commande";
import { trackEvent } from "@/lib/analytics";
import { suivreExpress } from "@/lib/suiviClient";
import { IconeWhatsApp } from "./WhatsAppLink";

/**
 * Capsule WhatsApp flottante, ordinateur uniquement (le mobile a la barre
 * fixe). Dans les couleurs du site (vert profond, filet laiton), libellé
 * toujours lisible, point vert qui pulse pour dire « ligne ouverte ». Elle apparaît après un début de lecture,
 * pas sur la page contact où le lien est déjà en évidence, ni dans le tunnel
 * de commande, où elle détournerait le client de son achat.
 */
export default function WhatsAppBubble() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const href = whatsappUrl();
  const eligible =
    Boolean(href) &&
    pathname !== "/contact" &&
    pathname !== "/permis-express" &&
    !pathname.startsWith("/admin") &&
    !estTunnelCommande(pathname);

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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire ou appeler sur WhatsApp"
      data-zone="bulle"
      // Masquée (avant défilement) : hors de l'ordre de tabulation et des lecteurs d'écran.
      tabIndex={visible ? undefined : -1}
      aria-hidden={visible ? undefined : true}
      onClick={() => {
        trackEvent("whatsapp_click", { source: "bulle_desktop" });
        suivreExpress("whatsapp");
      }}
      className={`wa-bubble hidden md:inline-flex fixed bottom-6 right-6 z-30 items-center gap-3 rounded-full border border-brass/60 bg-forest pl-4 pr-5 py-2.5 text-paper shadow-[0_6px_20px_rgba(34,53,44,0.28)] transition-all duration-300 hover:border-brass hover:bg-forest-2 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className="wa-bubble__pulse absolute inset-0 rounded-full bg-[#25d366]" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-[#25d366]" />
      </span>
      <IconeWhatsApp size={20} className="text-brass-2" />
      <span className="text-[0.9rem] font-bold tracking-[0.01em] whitespace-nowrap">Écrire sur WhatsApp</span>
    </a>
  );
}
