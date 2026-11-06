"use client";

import "leaflet/dist/leaflet.css";
import type { Map as CarteLeaflet, Marker, Polyline } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { formesBassin, type Bassin, type PhotosDp } from "@/lib/dpPiscine";

type Cle = "proche" | "lointaine";

interface Props {
  /** Contours du terrain, en [longitude, latitude]. */
  contours: [number, number][][];
  bassin: Bassin;
  vues: NonNullable<PhotosDp["vues"]>;
  /** Photos reçues : on ne demande l'endroit que pour celles-là. */
  photos: Record<Cle, boolean>;
  onChange: (v: NonNullable<PhotosDp["vues"]>) => void;
}

const TUILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal" +
  "&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg";
const ll = (pts: [number, number][]) => pts.map(([lon, lat]) => [lat, lon] as [number, number]);
const LIBELLE: Record<Cle, string> = { proche: "Photo de près (DPC7)", lointaine: "Photo de loin (DPC8)" };
const NUMERO: Record<Cle, string> = { proche: "7", lointaine: "8" };

/**
 * La notice du Cerfa 16702 demande, sur le plan de masse, l'endroit et l'angle de prise de vue des photos DPC7 et
 * DPC8 : le client touche la vue aérienne là où il se tenait ; une ligne va de ce point au bassin.
 */
export default function CartePointsDeVue({ contours, bassin, vues, photos, onChange }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<CarteLeaflet | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const traces = useRef<Partial<Record<Cle, { point: Marker; vise: Polyline }>>>({});
  const [active, setActive] = useState<Cle>(photos.proche ? "proche" : "lointaine");
  const [pret, setPret] = useState(false);
  const rappel = useRef({ active, vues, onChange });
  rappel.current = { active, vues, onChange };

  useEffect(() => {
    let annule = false;
    (async () => {
      const l = await import("leaflet");
      if (annule || !conteneur.current) return;
      L.current = l;
      const tactile = window.matchMedia("(pointer: coarse)").matches;
      const m = l.map(conteneur.current, { dragging: !tactile, touchZoom: true, scrollWheelZoom: false, zoomSnap: 0.5, maxZoom: 21 });
      m.attributionControl.setPrefix(false);
      l.tileLayer(TUILES, { maxNativeZoom: 19, maxZoom: 21, attribution: "© IGN · cadastre DGFiP" }).addTo(m);
      const terrain = l.polygon(contours.map((r) => [ll(r)]), { color: "#d9c69d", weight: 3, fillOpacity: 0.08, interactive: false }).addTo(m);
      const g = formesBassin(bassin);
      l.polygon(ll(g.bassin), { color: "#ffffff", weight: 1.5, fillColor: "#2b8fd1", fillOpacity: 0.85, interactive: false }).addTo(m);
      // la rue est dans le champ : on dézoome un peu plus que pour placer le bassin
      m.fitBounds(terrain.getBounds().pad(0.9), { maxZoom: 19, animate: false });
      m.on("click", (ev) => {
        const { active: a, vues: v, onChange: f } = rappel.current;
        f({ ...v, [a]: [Number(ev.latlng.lng.toFixed(7)), Number(ev.latlng.lat.toFixed(7))] });
      });
      carte.current = m;
      setPret(true);
    })();
    return () => {
      annule = true;
      carte.current?.remove();
      carte.current = null;
      traces.current = {};
    };
    // terrain et bassin fixés à cette étape (le parent recrée la carte avec une clé s'ils changent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const l = L.current;
    const m = carte.current;
    if (!pret || !l || !m) return;
    const [blon, blat] = bassin.centre;
    for (const cle of ["proche", "lointaine"] as const) {
      const p = vues[cle];
      const t = traces.current[cle];
      if (!p) {
        t?.point.remove();
        t?.vise.remove();
        delete traces.current[cle];
        continue;
      }
      const pos: [number, number] = [p[1], p[0]];
      if (t) {
        t.point.setLatLng(pos);
        t.vise.setLatLngs([pos, [blat, blon]]);
        continue;
      }
      traces.current[cle] = {
        vise: l.polyline([pos, [blat, blon]], { color: "#e040c8", weight: 2, dashArray: "6 5", interactive: false }).addTo(m),
        point: l
          .marker(pos, {
            interactive: false,
            icon: l.divIcon({
              className: "",
              html: `<span style="display:grid;place-items:center;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#e040c8;color:#fff;font:700 13px/1 sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)">${NUMERO[cle]}</span>`,
              iconSize: [0, 0],
            }),
          })
          .addTo(m),
      };
    }
  }, [pret, vues, bassin.centre]);

  const cles = (["proche", "lointaine"] as const).filter((k) => photos[k]);
  return (
    <div className="grid gap-3">
      <p className="text-[0.95rem]">
        <strong>D&apos;où avez-vous pris vos photos ?</strong> Choisissez la photo, puis touchez la carte à l&apos;endroit où
        vous vous teniez. La mairie veut le voir sur le plan de masse.
      </p>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Photo dont vous indiquez l'endroit">
        {cles.map((k) => (
          <button key={k} type="button" aria-pressed={active === k} className={`btn min-h-12 ${active === k ? "btn-ink" : "btn-line"}`} onClick={() => setActive(k)}>
            {LIBELLE[k]} {vues[k] ? "✓" : ""}
          </button>
        ))}
      </div>
      <div className="relative max-w-2xl overflow-hidden border border-ink bg-forest">
        <div
          ref={conteneur}
          className="h-[340px] w-full [&_.leaflet-control-attribution]:!bg-ink/40 [&_.leaflet-control-attribution]:!text-[0.65rem] [&_.leaflet-control-attribution]:!text-white"
          role="application"
          aria-label="Vue aérienne : touchez l'endroit d'où la photo a été prise"
        />
      </div>
      <p className="hint">Sans réponse, nous plaçons les photos dans la rue, face au bassin.</p>
    </div>
  );
}
