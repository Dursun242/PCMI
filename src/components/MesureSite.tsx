"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cibleLien, domaine, libelleTemps, niveauxNouveaux, pourcentLu, resumer } from "@/lib/mesure";

/** Démontage plus rapide que ça : double montage de React en développement, pas une page vue. */
const DEMONTAGE_MIN_MS = 300;

/**
 * Envoie un événement à Umami. Le script arrive après la page : on réessaie
 * pendant 10 s, puis on abandonne (bloqueur, hors production). Silencieux.
 * Les visites de l'administrateur sont exclues par Umami (voir AdminShell).
 */
function suivre(nom: string, donnees: Record<string, string>, essai = 0) {
  try {
    if (window.umami) return window.umami.track(nom, donnees);
    if (essai < 20) window.setTimeout(() => suivre(nom, donnees, essai + 1), 500);
  } catch {
    /* la mesure ne doit jamais casser un parcours */
  }
}

/** Emplacement lisible d'un élément : data-zone, en-tête, pied de page, ou titre de la section. */
function zoneDe(el: Element): string {
  const zone = el.closest<HTMLElement>("[data-zone]")?.dataset.zone;
  if (zone === "entete" || el.closest("header")) return "Menu du site";
  if (zone === "pied" || el.closest("footer")) return "Pied de page";
  if (zone) return zone;
  const titre = el.closest("section")?.querySelector("h1, h2");
  if (titre?.tagName === "H1") return "Haut de page";
  return titre ? resumer(titre.textContent, 45) : "Page";
}

/**
 * Parcours sur tout le site (hors /admin), envoyé à Umami page par page :
 * - lecture : paliers de 25, 50, 75 et 100 % de la page atteints ;
 * - temps_page : temps où la page était à l'écran, au départ ;
 * - question_ouverte : question de FAQ dépliée (<details>) ;
 * - clic : lien touché (devis, appel, WhatsApp, e-mail, autre site, autre page) et son emplacement ;
 * - video : lecture, son activé, moitié, fin (vidéos marquées data-mesure) ;
 * - formulaire_commence / formulaire_abandonne : premier champ touché, et nom
 *   du dernier champ si la page est quittée sans envoyer.
 * Complète les conversions déjà suivies (lib/analytics.ts).
 */
export default function MesureSite() {
  const page = usePathname();

  useEffect(() => {
    if (page.startsWith("/admin")) return;
    const debut = performance.now();
    let cumul = 0;
    let depuis: number | null = document.visibilityState === "visible" ? debut : null;
    let parti = false;
    const niveaux = new Set<number>();
    const videos = new Set<string>();
    let champ: string | null = null;
    let envoye = false;

    const lecture = () => {
      const pc = pourcentLu(window.scrollY, window.innerHeight, document.documentElement.scrollHeight);
      for (const n of niveauxNouveaux(pc, niveaux)) {
        niveaux.add(n);
        suivre("lecture", { page, niveau: `${n} %` });
      }
    };
    let image = 0;
    const defilement = () => {
      if (!image) image = requestAnimationFrame(() => ((image = 0), lecture()));
    };
    // Après la mise en page : une page courte est lue en entier sans défiler.
    const premiereLecture = window.setTimeout(lecture, 1500);

    const ouverture = (e: Event) => {
      const d = e.target;
      if (d instanceof HTMLDetailsElement && d.open) suivre("question_ouverte", { page, question: resumer(d.querySelector("summary")?.textContent) });
    };

    const toucher = (e: MouseEvent) => {
      const lien = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!lien) return;
      const href = lien.getAttribute("href") ?? "";
      const cible = cibleLien(href, window.location.origin);
      if (cible === "ancre") return;
      const donnees: Record<string, string> = { page, cible, zone: zoneDe(lien), texte: resumer(lien.textContent || lien.getAttribute("aria-label"), 40) };
      if (cible === "externe") donnees.domaine = domaine(new URL(href, window.location.href).href) ?? "";
      if (cible === "interne") donnees.vers = new URL(href, window.location.href).pathname;
      suivre("clic", donnees);
    };

    const video = (e: Event) => {
      const v = e.target;
      if (!(v instanceof HTMLVideoElement) || !v.dataset.mesure) return;
      const nom = v.dataset.mesure;
      const noter = (etat: string) => {
        const cle = `${nom}:${etat}`;
        if (videos.has(cle)) return;
        videos.add(cle);
        suivre("video", { page, video: nom, etat });
      };
      // La vidéo de l'accueil et de la page Express démarre seule, sans le son, quand on arrive dessus.
      if (e.type === "play") noter(v.muted ? "démarrage automatique (muet)" : "lecture avec le son");
      else if (e.type === "volumechange" && !v.muted && v.volume > 0) noter("son activé");
      else if (e.type === "timeupdate" && v.duration && v.currentTime / v.duration >= 0.5) noter("moitié");
      else if (e.type === "ended") noter("fin");
    };

    // « change » en plus de « focusin » : Safari ne donne pas le focus aux cases et boutons radio touchés.
    const saisie = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !t.closest("form") || !("name" in t) || typeof t.name !== "string" || !t.name) return;
      if (champ === null) suivre("formulaire_commence", { page });
      champ = t.name;
    };
    const envoi = () => {
      envoye = true;
    };

    const partir = (demontage = false) => {
      if (parti) return;
      if (depuis !== null) cumul += performance.now() - depuis;
      depuis = null;
      if (demontage && performance.now() - debut < DEMONTAGE_MIN_MS) return;
      parti = true;
      suivre("temps_page", { page, temps: libelleTemps(cumul) });
      if (champ !== null && !envoye) suivre("formulaire_abandonne", { page, dernier_champ: champ });
    };
    const visibilite = () => {
      if (document.visibilityState === "hidden") partir();
      else if (!parti) depuis = performance.now();
    };
    const depart = () => partir();

    const EVENEMENTS_VIDEO = ["play", "volumechange", "timeupdate", "ended"];
    // Phase de capture : « toggle » et les événements vidéo ne remontent pas, et un lien
    // qui ouvre l'appli Téléphone doit être noté avant de quitter la page.
    window.addEventListener("scroll", defilement, { passive: true });
    document.addEventListener("toggle", ouverture, true);
    document.addEventListener("click", toucher, true);
    for (const t of EVENEMENTS_VIDEO) document.addEventListener(t, video, true);
    document.addEventListener("focusin", saisie);
    document.addEventListener("change", saisie);
    document.addEventListener("submit", envoi, true);
    document.addEventListener("visibilitychange", visibilite);
    window.addEventListener("pagehide", depart);
    return () => {
      window.clearTimeout(premiereLecture);
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", defilement);
      document.removeEventListener("toggle", ouverture, true);
      document.removeEventListener("click", toucher, true);
      for (const t of EVENEMENTS_VIDEO) document.removeEventListener(t, video, true);
      document.removeEventListener("focusin", saisie);
      document.removeEventListener("change", saisie);
      document.removeEventListener("submit", envoi, true);
      document.removeEventListener("visibilitychange", visibilite);
      window.removeEventListener("pagehide", depart);
      partir(true);
    };
  }, [page]);

  return null;
}
