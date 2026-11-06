"use client";

import "leaflet/dist/leaflet.css";
import type { Map as CarteLeaflet, Marker, Polygon, Polyline } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { formesBassin, type Bassin } from "@/lib/dpPiscine";

interface Props {
  /** Contours de la parcelle, en [longitude, latitude]. */
  contours: [number, number][][];
  bassin: Bassin;
  onDeplacer: (centre: [number, number]) => void;
  /** Plus courte distance du bassin aux limites, tracée en pointillé. */
  distance: { d: number; de: [number, number]; a: [number, number] } | null;
  /** Distance trop courte (sous le recul conseillé) : trait rouge. */
  tropPres: boolean;
}

const TUILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal" +
  "&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg";

const ll = (pts: [number, number][]) => pts.map(([lon, lat]) => [lat, lon] as [number, number]);

/**
 * Vue aérienne du terrain : la parcelle, et le bassin avec ses margelles, sa
 * plage et son local technique. Le client fait glisser la poignée (ou touche
 * la carte) pour placer le bassin ; dimensions et orientation se règlent dans
 * le formulaire, le dessin suit.
 */
export default function CartePiscine({ contours, bassin, onDeplacer, distance, tropPres }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<CarteLeaflet | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const formes = useRef<{ plage: Polygon; margelles: Polygon; bassin: Polygon; local: Polygon; poignee: Marker; recul: Polyline } | null>(null);
  const rappel = useRef(onDeplacer);
  const [pret, setPret] = useState(false);
  rappel.current = onDeplacer;

  useEffect(() => {
    let annule = false;
    (async () => {
      const l = await import("leaflet");
      if (annule || !conteneur.current) return;
      L.current = l;
      const tactile = window.matchMedia("(pointer: coarse)").matches;
      const m = l.map(conteneur.current, { dragging: !tactile, touchZoom: true, scrollWheelZoom: false, zoomSnap: 0.5, maxZoom: 22 });
      m.attributionControl.setPrefix(false);
      l.tileLayer(TUILES, { maxNativeZoom: 19, maxZoom: 22, attribution: "© IGN · cadastre DGFiP" }).addTo(m);
      const terrain = l.polygon(contours.map(ll), { color: "#d9c69d", weight: 3, fillOpacity: 0.08, interactive: false }).addTo(m);
      m.fitBounds(terrain.getBounds().pad(0.25), { maxZoom: 20, animate: false });
      const style = (couleur: string, fond: number) => ({ color: couleur, weight: 1.5, fillColor: couleur, fillOpacity: fond, interactive: false });
      const poignee = l.marker([0, 0], {
        draggable: true,
        title: "Faites glisser pour placer le bassin",
        icon: l.divIcon({
          className: "",
          html: '<span style="display:block;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#1b1f1d;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>',
          iconSize: [0, 0],
        }),
      });
      formes.current = {
        plage: l.polygon([], style("#e8e0d0", 0.75)).addTo(m),
        margelles: l.polygon([], style("#cdbf9f", 0.95)).addTo(m),
        bassin: l.polygon([], { ...style("#2b8fd1", 0.85), color: "#ffffff" }).addTo(m),
        local: l.polygon([], style("#6b6f6c", 0.9)).addTo(m),
        recul: l.polyline([], { color: "#ffffff", weight: 3, dashArray: "6 6", interactive: false }).addTo(m),
        poignee: poignee.addTo(m),
      };
      poignee.on("drag", (ev) => {
        const p = (ev.target as Marker).getLatLng();
        rappel.current([p.lng, p.lat]);
      });
      m.on("click", (ev) => rappel.current([ev.latlng.lng, ev.latlng.lat]));
      carte.current = m;
      setPret(true);
    })();
    return () => {
      annule = true;
      carte.current?.remove();
      carte.current = null;
    };
    // la parcelle ne change pas pendant la vie de la carte (le parent la recrée avec une clé)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const f = formes.current;
    if (!pret || !f) return;
    const g = formesBassin(bassin);
    f.plage.setLatLngs(ll(g.plage));
    f.margelles.setLatLngs(ll(g.margelles));
    f.bassin.setLatLngs(ll(g.bassin));
    f.local.setLatLngs(g.local ? ll(g.local) : []);
    f.recul.setLatLngs(distance ? ll([distance.de, distance.a]) : []);
    f.recul.setStyle({ color: tropPres ? "#e0533d" : "#ffffff" });
    const [lon, lat] = bassin.centre;
    if (!f.poignee.getLatLng().equals([lat, lon])) f.poignee.setLatLng([lat, lon]);
  }, [pret, bassin, distance, tropPres]);

  return (
    <div className="relative self-start overflow-hidden border border-ink bg-forest">
      <div
        ref={conteneur}
        className="h-[380px] w-full sm:h-[460px] [&_.leaflet-control-attribution]:!bg-ink/40 [&_.leaflet-control-attribution]:!text-[0.65rem] [&_.leaflet-control-attribution]:!text-white"
        role="application"
        aria-label="Vue aérienne du terrain : faites glisser la poignée noire pour placer le bassin"
      />
    </div>
  );
}
