"use client";

import { useEffect } from "react";
import { suivreExpress } from "@/lib/suiviClient";

const CLE_VUE = "pcmi_express_vue";

/** Compte une visite de /permis-express, une seule fois par session (un rechargement ne recompte pas). */
export default function ExpressVue() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLE_VUE)) return;
      sessionStorage.setItem(CLE_VUE, "1");
    } catch {
      /* stockage indisponible : on compte quand même */
    }
    suivreExpress("vue");
  }, []);
  return null;
}
