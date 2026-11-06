"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { arasePrevue, dansTerrain, decaler, ecart, type Bassin } from "@/lib/dpPiscine";

interface Props {
  anneaux: [number, number][][];
  bassin: Bassin;
  /** Arase calculée (NGF), remontée au formulaire. */
  onArase?: (z: number | null) => void;
}

interface Profil {
  nom: "A" | "B";
  /** Distance le long de la coupe (m) et altitude TN (m NGF). */
  pts: [number, number][];
  /** Bord du bassin, de la plage, et limites du terrain (m le long de la coupe). */
  bassin: [number, number];
  plage: [number, number];
  limites: number[];
}

const fmt = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const RADIER = 0.2;
const PAROI = 0.2;
const REVANCHE = 0.15;

/** Coupes A-A (axe du bassin) et B-B (en travers) sur le terrain naturel réel (RGE ALTI IGN), en direct. */
export default function CoupeLive({ anneaux, bassin, onArase }: Props) {
  const [profils, setProfils] = useState<Profil[] | null>(null);
  // écran étroit (téléphone) : coupe recadrée sur le bassin, textes plus grands
  const boite = useRef<HTMLDivElement>(null);
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setEtroit(el.clientWidth < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, [profils]);
  const [erreur, setErreur] = useState<string | null>(null);
  const cle = `${bassin.centre.join(",")}|${bassin.angle}|${bassin.longueur}|${bassin.largeur}|${bassin.margelle}|${JSON.stringify(bassin.plage)}`;

  // demi-longueur des coupes : tout le terrain, + 3 m de chaque côté
  const portee = useMemo(() => {
    const ms = anneaux.flat().map((p) => ecart(bassin.centre, p));
    return Math.min(80, Math.max(...ms.map(([x, y]) => Math.hypot(x, y))) + 3);
  }, [anneaux, bassin.centre]);

  useEffect(() => {
    let annule = false;
    const t = setTimeout(async () => {
      setErreur(null);
      const a = (bassin.angle * Math.PI) / 180;
      const axes: { nom: "A" | "B"; u: [number, number]; demiB: number; plage: [number, number] }[] = [
        { nom: "A", u: [Math.cos(a), Math.sin(a)], demiB: bassin.longueur / 2, plage: [bassin.plage.petit_cote_1, bassin.plage.petit_cote_2] },
        { nom: "B", u: [-Math.sin(a), Math.cos(a)], demiB: bassin.largeur / 2, plage: [bassin.plage.grand_cote_1, bassin.plage.grand_cote_2] },
      ];
      try {
        const res = await Promise.all(
          axes.map(async (ax) => {
            const de = decaler(bassin.centre, -ax.u[0] * portee, -ax.u[1] * portee);
            const fin = decaler(bassin.centre, ax.u[0] * portee, ax.u[1] * portee);
            const n = 80;
            const r = await fetch(`/api/dp-piscine/profil?${new URLSearchParams({ de: de.join(","), a: fin.join(","), n: String(n) })}`);
            const j = (await r.json()) as { ok: boolean; z?: number[]; error?: string };
            if (!j.ok || !j.z) throw new Error(j.error ?? "profil indisponible");
            const L = 2 * portee;
            const pts = j.z.map((z, i) => [(i * L) / (j.z!.length - 1), z] as [number, number]);
            // limites : là où la ligne entre ou sort du terrain
            const limites: number[] = [];
            let avant: boolean | null = null;
            for (let k = 0; k <= 200; k++) {
              const s = (k * L) / 200;
              const dedans = dansTerrain(decaler(de, ax.u[0] * s, ax.u[1] * s), anneaux);
              if (avant !== null && dedans !== avant) limites.push(s);
              avant = dedans;
            }
            const sc = portee;
            return {
              nom: ax.nom,
              pts,
              bassin: [sc - ax.demiB, sc + ax.demiB] as [number, number],
              plage: [sc - ax.demiB - bassin.margelle - ax.plage[0], sc + ax.demiB + bassin.margelle + ax.plage[1]] as [number, number],
              limites,
            } satisfies Profil;
          }),
        );
        if (!annule) setProfils(res);
      } catch {
        if (!annule) setErreur("Altitudes du terrain indisponibles pour le moment : la coupe sera faite dans votre dossier.");
      }
    }, 400);
    return () => {
      annule = true;
      clearTimeout(t);
    };
    // la clé résume tout ce qui déplace les coupes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, portee]);

  const arase = useMemo(() => {
    if (!profils) return null;
    const zs = profils.flatMap((p) => p.pts.filter(([s]) => s >= p.bassin[0] && s <= p.bassin[1]).map(([, z]) => z));
    return arasePrevue(zs);
  }, [profils]);
  useEffect(() => onArase?.(arase), [arase, onArase]);

  if (erreur) return <p className="text-sm text-ink-2">{erreur}</p>;
  if (!profils || arase === null) return <p className="text-sm text-ink-2" role="status">Lecture des altitudes du terrain (IGN)…</p>;
  const fond = arase - bassin.profondeur;

  return (
    <div ref={boite} className="grid gap-5">
      {profils.map((p) => {
        // recadrage : tout le terrain sur grand écran, le bassin ± 6 m sur téléphone
        const s0 = etroit ? Math.max(0, p.plage[0] - 6) : 0;
        const s1 = etroit ? Math.min(p.pts.at(-1)![0], p.plage[1] + 6) : p.pts.at(-1)![0];
        const vus = p.pts.filter(([s]) => s >= s0 - 1 && s <= s1 + 1);
        const zs = vus.map(([, z]) => z);
        const zmin = Math.min(...zs, fond - RADIER) - 0.6;
        const zmax = Math.max(...zs, arase) + 0.8;
        const W = s1 - s0;
        const ex = Math.min(4, Math.max(1, ((etroit ? 0.4 : 0.22) * W) / (zmax - zmin)));
        const H = (zmax - zmin) * ex;
        const t = W / (etroit ? 24 : 55);
        const Y = (z: number) => (zmax - z) * ex;
        const tn = vus.map(([s, z]) => `${s.toFixed(2)},${Y(z).toFixed(2)}`).join(" ");
        const sous = p.pts.filter(([s]) => s >= p.plage[0] && s <= p.plage[1]).map(([, z]) => z);
        const deblai = Math.max(0, ...sous.map((z) => z - arase));
        const remblai = Math.max(0, ...sous.map((z) => arase - z));
        const [b0, b1] = p.bassin;
        const [q0, q1] = p.plage;
        return (
          <figure key={p.nom} className="grid gap-1.5">
            <figcaption className="flex flex-wrap justify-between gap-2 text-sm">
              <strong>Coupe {p.nom}-{p.nom} {p.nom === "A" ? "(dans la longueur)" : "(en travers)"}</strong>
              <span className="text-ink-2">
                {ex > 1 ? `hauteurs × ${fmt(ex, 1)} · ` : ""}déblai {fmt(deblai)} m · remblai {fmt(remblai)} m
              </span>
            </figcaption>
            <svg viewBox={`${s0} 0 ${W} ${H}`} className="block h-auto w-full border border-stone-2 bg-white" fontFamily="Lato, Arial, sans-serif" role="img"
              aria-label={`Coupe ${p.nom}-${p.nom} : arase ${fmt(arase)} NGF, fond ${fmt(fond)} NGF`}>
              <defs>
                <pattern id={`h${p.nom}`} width={t * 0.8} height={t * 0.8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2={t * 0.8} stroke="#c9ccc9" strokeWidth={t * 0.15} />
                </pattern>
              </defs>
              <polygon points={`${vus[0][0]},${H} ${tn} ${vus.at(-1)![0]},${H}`} fill={`url(#h${p.nom})`} />
              {/* fouille : blanc, parois et radier, eau */}
              <polygon points={`${q0},${Y(Math.max(...sous, arase) + 0.1)} ${q1},${Y(Math.max(...sous, arase) + 0.1)} ${q1},${Y(arase)} ${b1 + PAROI},${Y(arase)} ${b1 + PAROI},${Y(fond - RADIER)} ${b0 - PAROI},${Y(fond - RADIER)} ${b0 - PAROI},${Y(arase)} ${q0},${Y(arase)}`} fill="#fff" />
              <polyline points={tn} fill="none" stroke="#1b1f1d" strokeWidth={t * 0.12} />
              <rect x={b0 - PAROI} y={Y(arase)} width={b1 - b0 + 2 * PAROI} height={(bassin.profondeur + RADIER) * ex} fill="#8d938f" />
              <rect x={b0} y={Y(arase - REVANCHE)} width={b1 - b0} height={(bassin.profondeur - REVANCHE) * ex} fill="#96cdeb" />
              <line x1={q0} y1={Y(arase)} x2={q1} y2={Y(arase)} stroke="#1b1f1d" strokeWidth={t * 0.18} />
              {p.limites.map((s) => <line key={s} x1={s} y1={0} x2={s} y2={H} stroke="#c0392b" strokeWidth={t * 0.1} />)}
              <text x={(b0 + b1) / 2} y={Y(arase) - t * 0.9} fontSize={t} textAnchor="middle" fill="#1d5fa0" stroke="#fff" strokeWidth={t * 0.35} paintOrder="stroke">margelles {fmt(arase)} NGF</text>
              <text x={(b0 + b1) / 2} y={Y(fond - RADIER) + t * 1.3} fontSize={t} textAnchor="middle" fill="#1d5fa0" stroke="#fff" strokeWidth={t * 0.35} paintOrder="stroke">fond {fmt(fond)} NGF</text>
            </svg>
          </figure>
        );
      })}
      <p className="text-sm text-ink-2">
        Altitudes IGN (RGE ALTI, ±0,5 m). Margelles et plage à {fmt(arase)} NGF, fond plat à {fmt(fond)} NGF.
        {profils.some((p) => {
          const sous = p.pts.filter(([s]) => s >= p.plage[0] && s <= p.plage[1]).map(([, z]) => Math.abs(z - arase));
          return Math.max(0, ...sous) > 0.6;
        }) && <span className="block text-alert">Terrain en pente sous la plage : talus ou petit mur de soutènement à prévoir.</span>}
      </p>
    </div>
  );
}
