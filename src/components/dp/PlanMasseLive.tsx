"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BORNES,
  centreContour,
  dansTerrain,
  DIST_MAISON_MIN_M,
  RECUL_CONSEILLE_M,
  cotesLimites,
  decaler,
  distanceBati,
  ecart,
  formesBassin,
  type Bassin,
  type Cote,
} from "@/lib/dpPiscine";

interface Props {
  /** Parcelles du terrain. */
  anneaux: [number, number][][];
  /** Parcelles voisines (contours), en gris. */
  voisines: [number, number][][];
  /** Bâtiments (BD TOPO), en gris foncé. */
  batis: [number, number][][];
  bassin: Bassin;
  onChange: (b: Bassin) => void;
}

type Edition = { type: "limite"; cote: Cote } | { type: "maison"; cote: Cote } | { type: "longueur" } | { type: "largeur" };

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Plan de masse coté, en direct : le client fait glisser le bassin, le tourne avec la poignée, et touche une cote pour
 * la taper (« 3,00 m de la limite ») : le bassin se cale dessus. Même dessin que le DPC2 officiel, sans attendre.
 */
export default function PlanMasseLive({ anneaux, voisines, batis, bassin, onChange }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const glisse = useRef<{ mode: "deplacer" | "tourner"; depart: [number, number]; centre: [number, number] } | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [valeur, setValeur] = useState("");

  // repère local en mètres (x vers l'est, y vers le nord), centré sur le terrain
  const o = useMemo<[number, number]>(() => {
    const pts = anneaux.flat();
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    return [(Math.min(...lons) + Math.max(...lons)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  }, [anneaux]);
  const m = (p: [number, number]) => ecart(o, p);
  // cadrage : tout le terrain, ou le bassin et ses cotes (d'office sur téléphone)
  const boite = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<"terrain" | "bassin" | null>(null);
  useEffect(() => {
    if (zoom === null && boite.current) setZoom(boite.current.clientWidth < 640 ? "bassin" : "terrain");
  }, [zoom]);
  const vueTerrain = useMemo(() => {
    const ms = anneaux.flat().map((p) => ecart(o, p));
    const xs = ms.map((p) => p[0]);
    const ys = ms.map((p) => p[1]);
    const marge = Math.max(6, (Math.max(...xs) - Math.min(...xs)) * 0.18);
    return { x0: Math.min(...xs) - marge, x1: Math.max(...xs) + marge, y0: Math.min(...ys) - marge, y1: Math.max(...ys) + marge };
  }, [anneaux, o]);
  const cadreBassin = useRef(vueTerrain);
  const pts = (r: [number, number][]) => r.map((p) => { const [x, y] = m(p); return `${x.toFixed(2)},${(-y).toFixed(2)}`; }).join(" ");

  const f = formesBassin(bassin);
  const cotes = cotesLimites(f.bassin, anneaux);
  // distance à la maison : bâtiments du terrain seulement (pas ceux des voisins)
  const batisTerrain = useMemo(() => batis.filter((b) => dansTerrain(centreContour(b), anneaux)), [batis, anneaux]);
  const maison = distanceBati(f.bassin, batisTerrain);
  const montrerMaison = maison && maison.d < 15;

  // cadre « bassin » : la plage, le local, les cotes ; figé pendant qu'on fait glisser (pas de plan qui bouge sous le doigt)
  if (!glisse.current) {
    const qs = [...f.plage, ...(f.local ?? []), ...cotes.flatMap((c) => [c.de, c.a]), ...(maison && maison.d < 15 ? [maison.a] : [])].map((p) => ecart(o, p));
    const xs = qs.map((q) => q[0]);
    const ys = qs.map((q) => q[1]);
    const marge = 4;
    cadreBassin.current = { x0: Math.min(...xs) - marge, x1: Math.max(...xs) + marge, y0: Math.min(...ys) - marge, y1: Math.max(...ys) + marge };
  }
  const vue = zoom === "bassin" ? cadreBassin.current : vueTerrain;
  const W = vue.x1 - vue.x0;
  const H = vue.y1 - vue.y0;
  const t = Math.max(W, H * 1.2) / 48; // hauteur des textes (m)

  // poignée de rotation : au bout du bassin, au-delà de la plage
  const a = (bassin.angle * Math.PI) / 180;
  const portee = bassin.longueur / 2 + bassin.margelle + bassin.plage.petit_cote_2 + 1.2;
  const poignee = m(decaler(bassin.centre, portee * Math.cos(a), portee * Math.sin(a)));
  const centre = m(bassin.centre);

  function pointeur(e: React.PointerEvent): [number, number] {
    const s = svg.current;
    if (!s) return [0, 0];
    const p = s.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(s.getScreenCTM()?.inverse());
    return [q.x, -q.y];
  }

  function debut(mode: "deplacer" | "tourner", e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    glisse.current = { mode, depart: pointeur(e), centre: bassin.centre };
  }

  function bouger(e: React.PointerEvent) {
    const g = glisse.current;
    if (!g) return;
    const [x, y] = pointeur(e);
    if (g.mode === "deplacer") {
      onChange({ ...bassin, centre: decaler(g.centre, x - g.depart[0], y - g.depart[1]) });
    } else {
      const c = m(bassin.centre);
      const ang = (Math.atan2(y - c[1], x - c[0]) * 180) / Math.PI;
      onChange({ ...bassin, angle: Math.round(ang) });
    }
  }

  function ouvrir(ed: Edition) {
    setEdition(ed);
    const v = ed.type === "longueur" ? bassin.longueur : ed.type === "largeur" ? bassin.largeur : ed.cote.d;
    setValeur(String(v).replace(".", ","));
  }

  function appliquer(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(valeur.replace(",", "."));
    if (!edition || !Number.isFinite(v) || v < 0) return;
    if (edition.type === "longueur") onChange({ ...bassin, longueur: Math.min(BORNES.longueur[1], Math.max(BORNES.longueur[0], v)) });
    else if (edition.type === "largeur") onChange({ ...bassin, largeur: Math.min(BORNES.largeur[1], Math.max(BORNES.largeur[0], v)) });
    else {
      // le bassin glisse le long de la cote : de la limite (ou de la maison) vers le bassin
      const [dx, dy] = ecart(edition.cote.a, edition.cote.de);
      const n = Math.hypot(dx, dy) || 1;
      const k = v - edition.cote.d;
      onChange({ ...bassin, centre: decaler(bassin.centre, (dx / n) * k, (dy / n) * k) });
    }
    setEdition(null);
  }

  const poses: [number, number][] = [];
  function ligneCote(c: Cote, couleur: string, ed: Edition, cle: string) {
    const [x1, y1] = m(c.de);
    const [x2, y2] = m(c.a);
    let mx = (x1 + x2) / 2;
    let my = (y1 + y2) / 2;
    // étiquette déplacée le long de la cote (puis à côté) si elle tombe sur une autre
    for (let k = 0; k < 6 && poses.some(([px, py]) => Math.abs(px - mx) < t * 3.4 && Math.abs(py - my) < t * 1.5); k++) {
      const s = k % 2 ? -1 : 1;
      mx += s * t * 1.8;
      my += t * 1.6;
    }
    poses.push([mx, my]);
    return (
      <g key={cle} className="cursor-pointer" onClick={() => ouvrir(ed)}>
        <line x1={x1} y1={-y1} x2={x2} y2={-y2} stroke={couleur} strokeWidth={t * 0.12} />
        <circle cx={x1} cy={-y1} r={t * 0.18} fill={couleur} />
        <circle cx={x2} cy={-y2} r={t * 0.18} fill={couleur} />
        <rect x={mx - t * 1.6} y={-my - t * 0.75} width={t * 3.2} height={t * 1.3} rx={t * 0.2} fill="#fff" stroke={couleur} strokeWidth={t * 0.06} />
        <text x={mx} y={-my + t * 0.3} fontSize={t * 0.95} textAnchor="middle" fill={couleur} fontWeight={700}>{fmt(c.d)}</text>
      </g>
    );
  }

  // cotes du bassin : le long d'un grand côté et d'un petit côté, à l'extérieur de la plage
  const [q0, q1, , q3] = f.bassin.map(m);
  const decale = (p: [number, number], v: [number, number], k: number): [number, number] => [p[0] + v[0] * k, p[1] + v[1] * k];
  const nL: [number, number] = [-Math.sin(a), Math.cos(a)];
  const nl: [number, number] = [Math.cos(a), Math.sin(a)];
  // au-delà de la plage : grand côté « 1 » (à droite de l'axe) et petit côté « 1 » (à l'opposé de la poignée)
  const offL = -(bassin.margelle + bassin.plage.grand_cote_1 + 1.2);
  const offl = -(bassin.margelle + bassin.plage.petit_cote_1 + 1.2);
  const cotePropre = (p: [number, number], r: [number, number], n: [number, number], k: number, texte: string, ed: Edition) => {
    const [a1, a2] = [decale(p, n, k), decale(r, n, k)];
    return (
      <g className="cursor-pointer" onClick={() => ouvrir(ed)}>
        <line x1={a1[0]} y1={-a1[1]} x2={a2[0]} y2={-a2[1]} stroke="#1b1f1d" strokeWidth={t * 0.08} />
        <line x1={p[0]} y1={-p[1]} x2={a1[0]} y2={-a1[1]} stroke="#1b1f1d" strokeWidth={t * 0.04} />
        <line x1={r[0]} y1={-r[1]} x2={a2[0]} y2={-a2[1]} stroke="#1b1f1d" strokeWidth={t * 0.04} />
        <rect x={(a1[0] + a2[0]) / 2 - t * 1.6} y={-(a1[1] + a2[1]) / 2 - t * 0.75} width={t * 3.2} height={t * 1.3} rx={t * 0.2} fill="#fff" />
        <text x={(a1[0] + a2[0]) / 2} y={-(a1[1] + a2[1]) / 2 + t * 0.3} fontSize={t * 0.9} textAnchor="middle" fill="#1b1f1d">{texte}</text>
      </g>
    );
  };

  const libelle =
    edition?.type === "longueur" ? "Longueur du bassin" : edition?.type === "largeur" ? "Largeur du bassin" : edition?.type === "maison" ? "Distance à la maison" : "Distance à la limite";

  return (
    <div ref={boite} className="grid gap-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" className={`min-h-9 border px-3 text-sm transition-colors ${zoom === "bassin" ? "border-ink bg-ink text-white" : "border-stone-2 bg-paper text-ink hover:border-ink"}`} onClick={() => setZoom("bassin")}>Zoom sur le bassin</button>
        <button type="button" className={`min-h-9 border px-3 text-sm transition-colors ${zoom === "terrain" ? "border-ink bg-ink text-white" : "border-stone-2 bg-paper text-ink hover:border-ink"}`} onClick={() => setZoom("terrain")}>Tout le terrain</button>
      </div>
      <div className="relative overflow-hidden border border-ink bg-white">
        <svg
          ref={svg}
          viewBox={`${vue.x0} ${-vue.y1} ${W} ${H}`}
          className="block h-auto w-full select-none"
          style={{ aspectRatio: `${W} / ${H}`, maxHeight: "70vh" }}
          onPointerMove={bouger}
          onPointerUp={() => {
            // fin du glissement : le cadre « bassin » se recalcule (nouveau rendu)
            if (glisse.current) onChange({ ...bassin });
            glisse.current = null;
          }}
          onPointerLeave={() => (glisse.current = null)}
          role="application"
          aria-label="Plan de masse : faites glisser le bassin, tournez-le avec la poignée ronde, touchez une cote pour la modifier"
          fontFamily="Lato, Arial, sans-serif"
        >
          {voisines.map((r, i) => <polygon key={`v${i}`} points={pts(r)} fill="none" stroke="#b9bdba" strokeWidth={t * 0.05} />)}
          {anneaux.map((r, i) => <polygon key={`t${i}`} points={pts(r)} fill="#c8e4be" stroke="none" />)}
          {batis.map((r, i) => <polygon key={`b${i}`} points={pts(r)} fill="#d6d8d6" stroke="#8d938f" strokeWidth={t * 0.05} />)}
          {anneaux.map((r, i) => <polygon key={`l${i}`} points={pts(r)} fill="none" stroke="#c0392b" strokeWidth={t * 0.12} />)}
          <g className="cursor-move" style={{ touchAction: "none" }} onPointerDown={(e) => debut("deplacer", e)}>
            <polygon points={pts(f.plage)} fill="#e8e0d0" stroke="#9c9277" strokeWidth={t * 0.05} />
            <polygon points={pts(f.margelles)} fill="#d6cdba" stroke="#9c9277" strokeWidth={t * 0.05} />
            <polygon points={pts(f.bassin)} fill="#96cdeb" stroke="#2b6fa8" strokeWidth={t * 0.08} />
            {f.local && <polygon points={pts(f.local)} fill="#7d827f" stroke="#4b4f4d" strokeWidth={t * 0.05} />}
            <text x={centre[0]} y={-centre[1] + t * 0.35} fontSize={t * 0.9} textAnchor="middle" fill="#123" transform={`rotate(${-(((bassin.angle + 90) % 180) - 90)} ${centre[0]} ${-centre[1]})`}>
              PISCINE {fmt(bassin.longueur * bassin.largeur).replace(",00", "")} m²
            </text>
          </g>
          <line x1={centre[0]} y1={-centre[1]} x2={poignee[0]} y2={-poignee[1]} stroke="#1b1f1d" strokeWidth={t * 0.06} strokeDasharray={`${t * 0.3} ${t * 0.3}`} />
          <circle cx={poignee[0]} cy={-poignee[1]} r={t * 0.9} fill="#1b1f1d" stroke="#fff" strokeWidth={t * 0.15} className="cursor-grab" style={{ touchAction: "none" }} onPointerDown={(e) => debut("tourner", e)} />
          <text x={poignee[0]} y={-poignee[1] + t * 0.35} fontSize={t * 0.9} textAnchor="middle" fill="#fff" pointerEvents="none">↻</text>
          {cotesPropres()}
          {(poses.length = 0, null)}
          {cotes.map((c, i) => ligneCote(c, c.d < RECUL_CONSEILLE_M ? "#c0392b" : "#1d5fa0", { type: "limite", cote: c }, `c${i}`))}
          {montrerMaison && maison && ligneCote(maison, maison.d < DIST_MAISON_MIN_M ? "#c0392b" : "#a9884f", { type: "maison", cote: maison }, "maison")}
          <g transform={`translate(${vue.x1 - t * 2.5} ${-vue.y1 + t * 3})`}>
            <polygon points={`0,${-t * 1.6} ${t * 0.6},${t * 0.6} 0,${t * 0.2} ${-t * 0.6},${t * 0.6}`} fill="#1b1f1d" />
            <text y={-t * 2} fontSize={t} textAnchor="middle" fontWeight={700}>N</text>
          </g>
          <g transform={`translate(${vue.x0 + t} ${-vue.y0 - t * 1.2})`}>
            <rect width={5} height={t * 0.3} fill="#1b1f1d" />
            <text y={-t * 0.4} fontSize={t * 0.8}>0</text>
            <text x={5} y={-t * 0.4} fontSize={t * 0.8} textAnchor="middle">5 m</text>
          </g>
        </svg>
      </div>
      {edition ? (
        <form onSubmit={appliquer} className="flex flex-wrap items-end gap-3">
          <div className="field">
            <label htmlFor="dp-cote">{libelle} (m)</label>
            <input id="dp-cote" autoFocus inputMode="decimal" className="min-h-12 w-32" value={valeur} onChange={(e) => setValeur(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-ink">Appliquer</button>
          <button type="button" className="btn btn-line" onClick={() => setEdition(null)}>Annuler</button>
        </form>
      ) : (
        <p className="text-sm text-ink-2">
          Faites glisser le bassin, tournez-le avec la poignée ronde. Touchez une cote pour la taper : le bassin se cale dessus.
          {cotes.some((c) => c.d < RECUL_CONSEILLE_M) && <span className="block text-alert">En rouge : moins de {RECUL_CONSEILLE_M} m de la limite, souvent refusé par le PLU.</span>}
          {maison && maison.d < DIST_MAISON_MIN_M && <span className="block text-alert">Trop près de la maison : laissez {fmt(DIST_MAISON_MIN_M)} m au moins.</span>}
        </p>
      )}
    </div>
  );

  function cotesPropres() {
    return (
      <>
        {cotePropre(q0, q1, nL, offL, fmt(bassin.longueur), { type: "longueur" })}
        {cotePropre(q3, q0, nl, offl, fmt(bassin.largeur), { type: "largeur" })}
      </>
    );
  }
}
