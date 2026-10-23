"use client";

import { useEffect } from "react";
import { suivreExpress, suivreTemps } from "@/lib/suiviClient";

const CLE_VUE = "pcmi_express_vue";
const CLE_TEMPS = "pcmi_express_temps";

/** Lit puis pose un repère de session ; true s'il était déjà posé. Stockage indisponible : false (on compte quand même). */
function dejaFait(cle: string): boolean {
  try {
    if (sessionStorage.getItem(cle)) return true;
    sessionStorage.setItem(cle, "1");
  } catch {
    /* stockage indisponible */
  }
  return false;
}

/**
 * Compte une visite de /permis-express, une seule fois par session (un
 * rechargement ne recompte pas), et le temps passé : seulement le temps où la
 * page est à l'écran, envoyé une fois, au premier départ (autre onglet, appli
 * Téléphone ou WhatsApp, fermeture, page merci après l'envoi du formulaire).
 */
export default function ExpressVue() {
  useEffect(() => {
    if (!dejaFait(CLE_VUE)) suivreExpress("vue");
  }, []);

  useEffect(() => {
    let cumul = 0;
    let depuis = document.visibilityState === "visible" ? performance.now() : null;
    let envoye = false;

    const envoyer = () => {
      if (envoye) return;
      envoye = true;
      if (depuis !== null) cumul += performance.now() - depuis;
      depuis = null;
      if (!dejaFait(CLE_TEMPS)) suivreTemps(cumul);
    };
    const visibilite = () => {
      if (document.visibilityState === "hidden") envoyer();
    };

    document.addEventListener("visibilitychange", visibilite);
    window.addEventListener("pagehide", envoyer);
    return () => {
      document.removeEventListener("visibilitychange", visibilite);
      window.removeEventListener("pagehide", envoyer);
      envoyer();
    };
  }, []);

  return null;
}
