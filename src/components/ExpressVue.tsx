"use client";

import { useEffect } from "react";
import { trancheTemps, type Appareil, type Bilan, type Champ, type Clic, type Section, type ZoneSortie } from "@/lib/bilan";
import { clePage } from "@/lib/suite";
import { envoyerBilan, etatsVideo, formulaireAEteEnvoye, marquerSuite, suivreExpress } from "@/lib/suiviClient";

const CLE_VUE = "pcmi_express_vue";
const CLE_BILAN = "pcmi_express_bilan";
/** Démontage plus rapide que ça : double montage de React en développement, pas une visite. */
const DEMONTAGE_MIN_MS = 300;

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

function appareil(): Appareil {
  const l = window.innerWidth;
  return l < 640 ? "telephone" : l < 1024 ? "tablette" : "ordinateur";
}

/** Bouton touché : emplacement (data-zone le plus proche) et action, d'après le lien. */
function clic(cible: EventTarget | null): string | null {
  const lien = cible instanceof Element ? cible.closest("a") : null;
  const zone = lien?.closest<HTMLElement>("[data-zone]")?.dataset.zone;
  if (!lien || !zone) return null;
  const href = lien.getAttribute("href") ?? "";
  const action = href.startsWith("tel:") ? "appel" : href.includes("wa.me") ? "whatsapp" : href.endsWith("#devis") ? "devis" : null;
  return action && `${zone}-${action}`;
}

/** Lien vers une autre page du site : clé de la page visée et emplacement du lien ; null sinon. */
function sortie(cible: EventTarget | null): Bilan["sortie"] {
  const lien = cible instanceof Element ? cible.closest("a") : null;
  const href = lien?.getAttribute("href");
  if (!lien || !href || href.startsWith("#")) return null;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return null;
  const page = clePage(url.pathname);
  if (!page) return null;
  const zone = lien.closest<HTMLElement>("[data-zone]")?.dataset.zone;
  return { zone: zone === "entete" || zone === "pied" ? (zone as ZoneSortie) : "page", page };
}

/**
 * Mesure de /permis-express :
 * - une visite, une fois par session (un rechargement ne recompte pas) ;
 * - un bilan, envoyé une fois au premier départ (autre onglet, appli Téléphone
 *   ou WhatsApp, fermeture, page merci après l'envoi du formulaire) : temps où
 *   la page était à l'écran, appareil, sections vues (data-section), questions
 *   ouvertes (data-faq), boutons touchés (data-zone), dernier champ du
 *   formulaire commencé mais pas envoyé, lien pris vers une autre page du site
 *   (la suite du parcours est ensuite suivie par SuiteExpress). Les valeurs inconnues sont écartées
 *   par le serveur (lib/bilan.ts).
 */
export default function ExpressVue() {
  useEffect(() => {
    if (!dejaFait(CLE_VUE)) suivreExpress("vue");
  }, []);

  useEffect(() => {
    const debut = performance.now();
    let cumul = 0;
    let depuis = document.visibilityState === "visible" ? debut : null;
    let envoye = false;
    const sections = new Set<string>();
    const faq = new Set<string>();
    const clics = new Set<string>();
    let dernierChamp: string | null = null;
    let partVers: Bilan["sortie"] = null;

    const vues = new IntersectionObserver(
      (entrees) => entrees.forEach((e) => e.isIntersecting && sections.add((e.target as HTMLElement).dataset.section ?? "")),
      // Vue quand son haut passe au-dessus des deux tiers de l'écran.
      { rootMargin: "0px 0px -33% 0px" },
    );
    document.querySelectorAll("[data-section]").forEach((el) => vues.observe(el));

    const ouverture = (e: Event) => {
      const d = e.target;
      if (d instanceof HTMLDetailsElement && d.open && d.dataset.faq) faq.add(d.dataset.faq);
    };
    const toucher = (e: MouseEvent) => {
      const c = clic(e.target);
      if (c) clics.add(c);
      const s = sortie(e.target);
      if (s) {
        partVers = s;
        marquerSuite();
      }
    };
    // « change » en plus de « focusin » : Safari ne donne pas le focus aux cases et boutons radio touchés.
    const champ = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.closest("#devis form") && "name" in t && typeof t.name === "string" && t.name) dernierChamp = t.name;
    };

    const envoyer = (demontage = false) => {
      if (envoye) return;
      if (depuis !== null) cumul += performance.now() - depuis;
      depuis = null;
      if (demontage && performance.now() - debut < DEMONTAGE_MIN_MS) return;
      envoye = true;
      if (dejaFait(CLE_BILAN)) return;
      const bilan: Bilan = {
        temps: trancheTemps(cumul),
        appareil: appareil(),
        sections: [...sections] as Section[],
        faq: [...faq],
        clics: [...clics] as Clic[],
        abandon: formulaireAEteEnvoye() ? null : (dernierChamp as Champ | null),
        envoye: formulaireAEteEnvoye(),
        sortie: partVers,
        video: etatsVideo(),
      };
      envoyerBilan(bilan);
    };
    const visibilite = () => {
      if (document.visibilityState === "hidden") envoyer();
    };
    const depart = () => envoyer();

    // Phase de capture : « toggle » ne remonte pas, et un lien qui ouvre l'appli Téléphone doit être noté avant.
    document.addEventListener("toggle", ouverture, true);
    document.addEventListener("click", toucher, true);
    document.addEventListener("focusin", champ);
    document.addEventListener("change", champ);
    document.addEventListener("visibilitychange", visibilite);
    window.addEventListener("pagehide", depart);
    return () => {
      vues.disconnect();
      document.removeEventListener("toggle", ouverture, true);
      document.removeEventListener("click", toucher, true);
      document.removeEventListener("focusin", champ);
      document.removeEventListener("change", champ);
      document.removeEventListener("visibilitychange", visibilite);
      window.removeEventListener("pagehide", depart);
      envoyer(true);
    };
  }, []);

  return null;
}
