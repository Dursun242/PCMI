"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clePage } from "@/lib/suite";
import { suivreSuite } from "@/lib/suiviClient";

/** Page de remerciement d'un formulaire du site ; celle de la page Express est déjà comptée comme demande. */
const MERCI = /^\/devis\/merci(?:\/([a-z0-9-]+))?\/?$/;

/**
 * Suite du parcours des visiteurs partis de /permis-express vers une autre
 * page du site : pages vues, appels, WhatsApp, demandes envoyées. Ne fait rien
 * pour les autres visiteurs (voir suivreSuite dans lib/suiviClient.ts).
 */
export default function SuiteExpress() {
  const path = usePathname();

  useEffect(() => {
    if (path === "/permis-express") return;
    const merci = MERCI.exec(path);
    if (!merci) suivreSuite("page", clePage(path));
    else if (merci[1] !== "express") suivreSuite("demande", merci[1] ?? "devis");
  }, [path]);

  useEffect(() => {
    const toucher = (e: MouseEvent) => {
      const href = (e.target instanceof Element ? e.target.closest("a") : null)?.getAttribute("href") ?? "";
      const page = clePage(window.location.pathname);
      if (href.startsWith("tel:")) suivreSuite("appel", page);
      else if (href.includes("wa.me")) suivreSuite("whatsapp", page);
    };
    document.addEventListener("click", toucher, true);
    return () => document.removeEventListener("click", toucher, true);
  }, []);

  return null;
}
