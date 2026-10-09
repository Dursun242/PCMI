"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import carte from "@/config/carte-le-havre.json";
import { KM_PAR_DEGRE, classeCommune, vueEnsemble, type FondDeCarte, type PointPublic, type Vue } from "@/lib/carte";

const fond = carte as FondDeCarte;
/** Zoom maximal : 8 unités de carte à l'écran, soit quelques centaines de mètres. */
const LARGEUR_MIN = 8;
const ECHELLES_KM = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
const REPERE = "M0 0C-3-7-11-11-11-19a11 11 0 0 1 22 0C11-11 3-7 0 0Z";

type Props = {
  points: PointPublic[];
  /** Communes qui ont au moins un chantier, mises en avant sur le fond. */
  communes: string[];
};

/**
 * Carte des références : fond des communes autour du Havre, un repère par
 * chantier, et la liste à côté. Cliquer un repère ou une fiche de la liste
 * ouvre la photo. Styles : section « Carte des références » de globals.css.
 *
 * Sur une page qui défile, la molette seule fait défiler la page : on zoome
 * avec Ctrl + molette (ou le pincement du pavé tactile) et les boutons ; sur
 * mobile, un doigt fait défiler la page et deux doigts zooment.
 */
export default function CarteChantiers({ points, communes }: Props) {
  const boite = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const [taille, setTaille] = useState({ w: 1000, h: 625 });
  const [vue, setVue] = useState<Vue>(() => vueEnsemble(points, 1.6));
  const [sel, setSel] = useState<number | null>(null);
  const vueRef = useRef(vue);
  const anim = useRef(0);
  const aspect = taille.w / Math.max(taille.h, 1);

  useEffect(() => {
    vueRef.current = vue;
  }, [vue]);

  /** Va vers une vue, en douceur sauf si l'utilisateur a demandé moins d'animations. */
  const aller = useCallback((cible: Vue, animer: boolean) => {
    cancelAnimationFrame(anim.current);
    if (!animer || matchMedia("(prefers-reduced-motion: reduce)").matches) return setVue(cible);
    const depart = vueRef.current;
    const t0 = performance.now();
    const pas = (t: number) => {
      const k = Math.min((t - t0) / 450, 1);
      const e = 1 - Math.pow(1 - k, 3);
      setVue({ x: depart.x + (cible.x - depart.x) * e, y: depart.y + (cible.y - depart.y) * e, w: depart.w + (cible.w - depart.w) * e });
      if (k < 1) anim.current = requestAnimationFrame(pas);
    };
    anim.current = requestAnimationFrame(pas);
  }, []);

  /** Zoom de facteur f autour d'un point de l'écran (coordonnées client). */
  const zoomer = useCallback((f: number, cx: number, cy: number) => {
    const r = boite.current?.getBoundingClientRect();
    if (!r) return;
    cancelAnimationFrame(anim.current);
    setVue((v) => {
      const h = (v.w * r.height) / r.width;
      const mx = v.x + ((cx - r.left) / r.width) * v.w;
      const my = v.y + ((cy - r.top) / r.height) * h;
      const w = Math.min(Math.max(v.w * f, LARGEUR_MIN), fond.W * 1.2);
      const k = w / v.w;
      return { x: mx - (mx - v.x) * k, y: my - (my - v.y) * k, w };
    });
  }, []);

  const deplacer = useCallback((dx: number, dy: number) => {
    const largeur = boite.current?.clientWidth ?? 1;
    setVue((v) => ({ ...v, x: v.x - (dx * v.w) / largeur, y: v.y - (dy * v.w) / largeur }));
  }, []);

  const auCentre = useCallback((f: number) => {
    const r = boite.current?.getBoundingClientRect();
    if (r) zoomer(f, r.left + r.width / 2, r.top + r.height / 2);
  }, [zoomer]);

  // Taille de la carte : au premier relevé, on cadre tous les chantiers.
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    let cadre = false;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setTaille({ w: width, h: height });
      if (!cadre) {
        cadre = true;
        setVue(vueEnsemble(points, width / Math.max(height, 1)));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [points]);

  // Souris : glisser pour déplacer ; tactile : deux doigts pour zoomer et déplacer ; Ctrl + molette pour zoomer.
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const doigts = new Map<number, PointerEvent>();
    let ecart = 0;
    let bouge = false;
    const horsCarte = (t: EventTarget | null) => (t as Element | null)?.closest?.("button, .pin, .carte-fiche") != null;

    const bas = (e: PointerEvent) => {
      if (horsCarte(e.target)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      doigts.set(e.pointerId, e);
      bouge = false;
      if (e.pointerType === "mouse") el.setPointerCapture(e.pointerId);
    };
    const mouvement = (e: PointerEvent) => {
      const avant = doigts.get(e.pointerId);
      if (!avant) return;
      doigts.set(e.pointerId, e);
      if (doigts.size === 1 && e.pointerType === "mouse") {
        const dx = e.clientX - avant.clientX;
        const dy = e.clientY - avant.clientY;
        if (Math.abs(dx) + Math.abs(dy) > 1) bouge = true;
        el.classList.add("glisse");
        deplacer(dx, dy);
      } else if (doigts.size === 2) {
        const [a, b] = [...doigts.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (ecart) zoomer(ecart / d, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        ecart = d;
        bouge = true;
      }
    };
    const haut = (e: PointerEvent) => {
      const etaitSurCarte = doigts.delete(e.pointerId);
      if (doigts.size < 2) ecart = 0;
      if (!doigts.size) el.classList.remove("glisse");
      if (etaitSurCarte && e.type === "pointerup" && !bouge && !horsCarte(e.target)) setSel(null);
    };
    const molette = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomer(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY);
    };
    el.addEventListener("pointerdown", bas);
    el.addEventListener("pointermove", mouvement);
    el.addEventListener("pointerup", haut);
    el.addEventListener("pointercancel", haut);
    el.addEventListener("wheel", molette, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", bas);
      el.removeEventListener("pointermove", mouvement);
      el.removeEventListener("pointerup", haut);
      el.removeEventListener("pointercancel", haut);
      el.removeEventListener("wheel", molette);
      cancelAnimationFrame(anim.current);
    };
  }, [deplacer, zoomer]);

  // Échap ferme la fiche ouverte.
  useEffect(() => {
    if (sel === null) return;
    const touche = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [sel]);

  /**
   * Ouvre un chantier ; depuis la liste, la carte vole jusqu'à lui. Sur mobile la
   * liste est sous la carte : si la carte n'est pas entièrement à l'écran, la page
   * remonte jusqu'à elle, sinon la fiche s'ouvrirait hors de vue.
   */
  function choisir(i: number, voler: boolean) {
    setSel(i);
    const p = points[i];
    if (voler) {
      const w = Math.min(vueRef.current.w, 160);
      const h = w / aspect;
      aller({ x: p.x - w / 2, y: p.y - h * 0.7, w }, true);
      const r = boite.current?.getBoundingClientRect();
      if (r && (r.top < 0 || r.bottom > window.innerHeight)) {
        const doux = !matchMedia("(prefers-reduced-motion: reduce)").matches;
        boite.current?.scrollIntoView({ block: "center", behavior: doux ? "smooth" : "auto" });
      }
    } else if (matchMedia("(min-width: 1024px)").matches) {
      liste.current?.children[i]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  const fondSvg = useMemo(() => {
    const avecChantier = new Set(communes);
    return (
      <g aria-hidden="true">
        <g className="carte-rivage">
          {fond.paths.map(([, d], i) => <path key={i} d={d} />)}
        </g>
        <g className="carte-communes">
          {fond.paths.map(([nom, d], i) => <path key={i} d={d} className={classeCommune(nom, i, avecChantier)} />)}
        </g>
      </g>
    );
  }, [communes]);

  const px = vue.w / Math.max(taille.w, 1); // unités de carte par pixel
  const hauteur = vue.w / aspect;
  const kmParPx = (KM_PAR_DEGRE / fond.sx) * px;
  const km = ECHELLES_KM.find((k) => k / kmParPx >= 60) ?? 20;
  const detail = vue.w / fond.W < 0.75; // assez zoomé pour afficher toutes les villes repères
  const ordre = points.map((_, i) => i).sort((a, b) => Number(a === sel) - Number(b === sel)); // repère choisi au-dessus

  const fiche = sel === null ? null : points[sel];
  const ficheX = fiche ? ((fiche.x - vue.x) / vue.w) * taille.w : 0;
  const ficheY = fiche ? ((fiche.y - vue.y) / hauteur) * taille.h : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div>
        <div ref={boite} className="carte relative h-[58vh] min-h-[340px] overflow-hidden border border-stone-2 lg:h-[min(76vh,720px)]">
          <svg viewBox={`${vue.x} ${vue.y} ${vue.w} ${hauteur}`} className="block h-full w-full" aria-label="Carte des chantiers autour du Havre">
            {fondSvg}
            <g aria-hidden="true">
              {fond.labels.map(([nom, x, y]) => {
                const grand = nom === "Le Havre";
                if (!grand && !detail) return null;
                return (
                  <text key={nom} x={x} y={y} className="carte-ville" fontSize={(grand ? 12 : 9.5) * px} strokeWidth={3 * px}>
                    {nom.toUpperCase()}
                  </text>
                );
              })}
            </g>
            <g>
              {ordre.map((i) => {
                const p = points[i];
                return (
                  <g
                    key={i}
                    className={`pin${sel === i ? " on" : ""}`}
                    transform={`translate(${p.x} ${p.y}) scale(${px})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${p.titre}, ${p.lieu}`}
                    aria-pressed={sel === i}
                    onClick={(e) => {
                      e.stopPropagation();
                      choisir(i, false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        choisir(i, false);
                      }
                    }}
                  >
                    <circle className="halo" r="7" />
                    <path d={REPERE} />
                    <circle className="oeil" cy="-19" r="4" />
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="carte-zoom absolute right-3 top-3 flex flex-col">
            <button type="button" aria-label="Zoomer" onClick={() => auCentre(0.6)}>+</button>
            <button type="button" aria-label="Dézoomer" onClick={() => auCentre(1 / 0.6)}>−</button>
            <button
              type="button"
              aria-label="Recentrer sur les chantiers"
              onClick={() => {
                setSel(null);
                aller(vueEnsemble(points, aspect), true);
              }}
            >
              ⌖
            </button>
          </div>

          <div className="carte-echelle absolute bottom-2 left-3" aria-hidden="true">
            <span>{km < 1 ? `${km * 1000} m` : `${km} km`}</span>
            <i style={{ width: `${km / kmParPx}px` }} />
          </div>

          {fiche && (
            <div
              className={`carte-fiche absolute${ficheY < 250 ? " dessous" : ""}`}
              style={{ left: Math.min(Math.max(ficheX, 116), taille.w - 116), top: ficheY }}
            >
              <div className="relative aspect-[3/2]">
                <Image src={fiche.photo} alt={fiche.titre} fill sizes="250px" className="object-cover" />
              </div>
              <div className="px-3.5 pb-3.5 pt-3">
                <p className="font-bold leading-snug">{fiche.titre}</p>
                <p className="mt-1 text-[0.82rem] text-ink-2">{fiche.lieu}</p>
              </div>
              <button type="button" aria-label="Fermer la fiche" className="carte-fermer" onClick={() => setSel(null)}>
                ×
              </button>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-2">
          Zoom : boutons + et −, Ctrl + molette, ou deux doigts sur mobile. Fond de carte : limites communales IGN / Etalab
          (licence ouverte).
        </p>
      </div>

      <div className="flex flex-col lg:h-[min(76vh,720px)]">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
          {points.length} références
        </p>
        <ul ref={liste} className="mt-3 grid content-start gap-2.5 lg:overflow-y-auto lg:pr-1.5">
          {points.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={sel === i}
                onClick={() => choisir(i, true)}
                className="carte-carte grid w-full grid-cols-[112px_1fr] items-start gap-3 border border-stone-2 bg-paper p-2 text-left"
              >
                <Image src={p.photo} alt="" width={112} height={84} sizes="112px" className="h-[84px] w-[112px] object-cover" />
                <span>
                  <span className="display block text-[1.2rem] leading-tight">{p.titre}</span>
                  <span className="mt-1 block text-sm text-ink-2">{p.lieu}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
