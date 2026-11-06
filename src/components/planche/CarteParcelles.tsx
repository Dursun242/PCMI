"use client";

import "leaflet/dist/leaflet.css";
import type { Layer, Map as CarteLeaflet, Marker, Polygon } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { referenceCourte, type ParcelleCandidate } from "@/lib/planche";

interface Props {
  /** Parcelles autour de l'adresse (la première est la plus proche). */
  parcelles: ParcelleCandidate[];
  choisie: string;
  /** Autres parcelles du même terrain, surlignées aussi (DP piscine : terrain de plusieurs parcelles). */
  aussi?: string[];
  onChoisir: (p: ParcelleCandidate) => void;
}

/** Orthophoto IGN en tuiles (WMTS, projection web). */
const TUILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal" +
  "&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg";
/** En dessous de ce zoom, la carte couvre trop de terrain pour charger les parcelles. */
const ZOOM_PARCELLES = 17;
const ZOOM_NUMEROS = 18;
const PARCELLES_GARDEES = 1500;

const STYLE_AUTRE = { color: "#ffffff", weight: 1.2, fillColor: "#ffffff", fillOpacity: 0.04, opacity: 0.9 };
const STYLE_CHOISIE = { color: "#d9c69d", weight: 3.5, fillColor: "#d9c69d", fillOpacity: 0.38, opacity: 1 };

const latlngs = (p: ParcelleCandidate) => p.contours.map((a) => a.map(([lon, lat]) => [lat, lon] as [number, number]));

function centre(p: ParcelleCandidate): [number, number] {
  const pts = p.contours[0] ?? [];
  return [pts.reduce((s, q) => s + q[1], 0) / pts.length, pts.reduce((s, q) => s + q[0], 0) / pts.length];
}

const etiquette = (numero: string, actif: boolean) =>
  `<span style="display:inline-block;transform:translate(-50%,-50%);font:${actif ? 700 : 600} 13px/1 Lato,Arial,sans-serif;color:#fff;` +
  `text-shadow:0 0 3px #1b1f1d,0 0 3px #1b1f1d,0 0 2px #1b1f1d;white-space:nowrap;pointer-events:none">${numero.replace(/^0+/, "")}</span>`;

/**
 * Carte du terrain : orthophoto IGN et parcelles cadastrales, que l'on fait
 * glisser et zoomer. Les parcelles se chargent au fil des déplacements ; on
 * touche la sienne pour la choisir. Sur téléphone, la carte se déplace à deux
 * doigts, pour que la page reste facile à faire défiler.
 */
export default function CarteParcelles({ parcelles, choisie, onChoisir, aussi = [] }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<CarteLeaflet | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const couches = useRef(new Map<string, { p: ParcelleCandidate; poly: Polygon; num: Layer }>());
  const rappel = useRef(onChoisir);
  const choix = useRef(choisie);
  const [pret, setPret] = useState(false);
  const [aide, setAide] = useState<string | null>(null);

  rappel.current = onChoisir;
  choix.current = choisie;
  const aussiRef = useRef(aussi);
  aussiRef.current = aussi;
  // Les effets appellent ces fonctions par une référence : elles lisent toujours l'état courant.
  const actions = useRef<{ ajouter: (liste: ParcelleCandidate[]) => void; styler: (idu: string) => void } | null>(null);

  const styler = (idu: string) => {
    const c = couches.current.get(idu);
    if (!c || !L.current) return;
    const actif = idu === choix.current || aussiRef.current.includes(idu);
    c.poly.setStyle(actif ? STYLE_CHOISIE : STYLE_AUTRE);
    if (actif && carte.current?.hasLayer(c.poly)) c.poly.bringToFront();
    (c.num as Marker).setIcon(L.current.divIcon({ className: "", html: etiquette(c.p.numero, actif), iconSize: [0, 0] }));
  };

  const ajouter = (liste: ParcelleCandidate[]) => {
    const l = L.current;
    const m = carte.current;
    if (!l || !m) return;
    for (const p of liste) {
      if (couches.current.has(p.idu) || !p.contours.length) continue;
      const poly = l.polygon(latlngs(p), { ...STYLE_AUTRE, bubblingMouseEvents: false }).addTo(m);
      poly.on("click", () => rappel.current(p));
      const num = l.marker(centre(p), {
        interactive: false,
        keyboard: false,
        icon: l.divIcon({ className: "", html: etiquette(p.numero, false), iconSize: [0, 0] }),
      });
      if (m.getZoom() >= ZOOM_NUMEROS) num.addTo(m);
      couches.current.set(p.idu, { p, poly, num });
      styler(p.idu);
    }
    // Mémoire bornée : on oublie les plus anciennes, jamais la parcelle choisie.
    if (couches.current.size > PARCELLES_GARDEES) {
      for (const [idu, c] of couches.current) {
        if (couches.current.size <= PARCELLES_GARDEES) break;
        if (idu === choix.current || aussiRef.current.includes(idu)) continue;
        c.poly.remove();
        c.num.remove();
        couches.current.delete(idu);
      }
    }
  };

  actions.current = { ajouter, styler };

  // Création de la carte, une fois (Leaflet ne se charge que dans le navigateur).
  useEffect(() => {
    let annule = false;
    const registre = couches.current;
    let charge: AbortController | null = null;
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const l = await import("leaflet");
      if (annule || !conteneur.current) return;
      L.current = l;
      const tactile = window.matchMedia("(pointer: coarse)").matches;
      const m = l.map(conteneur.current, {
        dragging: !tactile,
        touchZoom: true,
        scrollWheelZoom: false,
        zoomSnap: 0.5,
        maxZoom: 21,
        attributionControl: true,
      });
      m.attributionControl.setPrefix(false);
      l.tileLayer(TUILES, { maxNativeZoom: 19, maxZoom: 21, attribution: "© IGN · cadastre DGFiP" }).addTo(m);
      carte.current = m;

      // Molette seulement après un clic dans la carte : la page défile normalement.
      m.on("click", () => m.scrollWheelZoom.enable());
      m.on("mouseout", () => m.scrollWheelZoom.disable());

      m.on("zoomend", () => {
        const voir = m.getZoom() >= ZOOM_NUMEROS;
        for (const c of couches.current.values()) {
          if (voir) c.num.addTo(m);
          else c.num.remove();
        }
      });

      m.on("moveend", () => {
        clearTimeout(minuterie);
        if (m.getZoom() < ZOOM_PARCELLES) {
          setAide("Zoomez pour voir les parcelles.");
          return;
        }
        setAide((a) => (a === "Zoomez pour voir les parcelles." ? null : a));
        minuterie = setTimeout(async () => {
          charge?.abort();
          charge = new AbortController();
          const b = m.getBounds();
          const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((v) => v.toFixed(6)).join(",");
          try {
            const r = await fetch(`/api/planche-gratuite/parcelles?${new URLSearchParams({ bbox })}`, { signal: charge.signal });
            const json = await r.json();
            if (json.ok) actions.current?.ajouter(json.parcelles as ParcelleCandidate[]);
          } catch {
            /* déplacement suivant ou réseau coupé : les parcelles déjà là restent utilisables */
          }
        }, 350);
      });

      // Téléphone : un doigt fait défiler la page, deux doigts déplacent la carte.
      if (tactile) {
        let masquer: ReturnType<typeof setTimeout> | undefined;
        conteneur.current.addEventListener(
          "touchmove",
          (e) => {
            if (e.touches.length !== 1) return;
            setAide("Utilisez deux doigts pour déplacer la carte.");
            clearTimeout(masquer);
            masquer = setTimeout(() => setAide(null), 1400);
          },
          { passive: true },
        );
      }
      setPret(true);
    })();
    return () => {
      annule = true;
      clearTimeout(minuterie);
      charge?.abort();
      carte.current?.remove();
      carte.current = null;
      registre.clear();
    };
  }, []);

  // Nouvelle recherche : on repart des parcelles de l'adresse et on cadre la parcelle proposée en entier.
  useEffect(() => {
    const m = carte.current;
    const l = L.current;
    if (!pret || !m || !l) return;
    for (const c of couches.current.values()) {
      c.poly.remove();
      c.num.remove();
    }
    couches.current.clear();
    // La vue d'abord : Leaflet ne dessine (ni ne met au premier plan) une parcelle que sur une carte cadrée.
    const cible = parcelles.find((p) => p.idu === choix.current) ?? parcelles[0];
    if (cible) {
      m.fitBounds(l.latLngBounds(latlngs(cible).flat()).pad(0.6), { maxZoom: 19, animate: false });
    }
    actions.current?.ajouter(parcelles);
  }, [pret, parcelles]);

  // Changement de parcelle choisie : style à jour (et la nouvelle passe devant).
  useEffect(() => {
    for (const idu of couches.current.keys()) actions.current?.styler(idu);
  }, [choisie, aussi.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Liste de secours (clavier, lecteur d'écran) : les voisines de l'adresse, plus la parcelle choisie sur la carte.
  const choisieAilleurs = couches.current.get(choisie)?.p;
  const proches = parcelles.some((p) => p.idu === choisie) || !choisieAilleurs ? parcelles.slice(0, 12) : [choisieAilleurs, ...parcelles.slice(0, 11)];

  return (
    <div className="grid gap-2">
      <div className="relative overflow-hidden border border-ink bg-forest">
        <div
          ref={conteneur}
          className="h-[340px] w-full sm:h-[420px] [&_.leaflet-control-attribution]:!bg-ink/40 [&_.leaflet-control-attribution]:!text-[0.65rem] [&_.leaflet-control-attribution]:!text-white"
          role="application"
          aria-label="Carte des parcelles : faites-la glisser, zoomez et touchez votre parcelle"
        />
        {aide && (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 z-[1000] mx-auto w-max max-w-[85%] -translate-y-1/2 bg-ink/80 px-4 py-2 text-center text-sm text-white">
            {aide}
          </p>
        )}
      </div>
      {/* Choix au clavier ou sans la carte. */}
      <label className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
        <span>Ou choisissez dans la liste :</span>
        <select
          className="min-h-10 border border-stone-2 bg-paper px-2 text-ink"
          value={choisie}
          onChange={(e) => {
            const p = proches.find((x) => x.idu === e.target.value);
            if (p) onChoisir(p);
          }}
        >
          {proches.map((p) => (
            <option key={p.idu} value={p.idu}>
              {referenceCourte(p.idu)} · {p.contenance.toLocaleString("fr-FR")} m²
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
