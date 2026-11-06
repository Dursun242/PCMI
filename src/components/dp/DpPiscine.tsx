"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import ChampAdresse from "@/components/ChampAdresse";
import CarteParcelles from "@/components/planche/CarteParcelles";
import CoupeLive from "@/components/dp/CoupeLive";
import PlanMasseLive from "@/components/dp/PlanMasseLive";
import PhotosDp from "@/components/dp/PhotosDp";
import ReglagesBassin from "@/components/dp/ReglagesBassin";
import { trackEvent } from "@/lib/analytics";
import { MARGELLE_DEFAUT_M, PLAGE_DEFAUT_M, PRIX_DP_PISCINE_TTC, RECUL_CONSEILLE_M, placementInitial, surBati, photosCompletes, type PhotosDp as Photos, angleTerrain, distanceLimites, centreContour, dansTerrain, formesBassin, regimeIndicatif, type Bassin, type ErreursDp } from "@/lib/dpPiscine";
import { referenceCourte, type ParcelleCandidate, type RechercheTerrain } from "@/lib/planche";

const CartePiscine = dynamic(() => import("@/components/dp/CartePiscine"), { ssr: false });

const lien = "text-ink underline decoration-brass underline-offset-4";

function Etape({ n, titre, children, actif = true }: { n: number; titre: string; children: React.ReactNode; actif?: boolean }) {
  return (
    <section className={`grid gap-5 border-t border-stone-2 pt-7 transition-opacity duration-300 ${actif ? "" : "opacity-40"}`} inert={!actif}>
      <h2 className="flex items-baseline gap-4 text-xl font-bold">
        <span className="numeral text-base font-bold tracking-[0.15em] text-bronze" aria-hidden="true">{String(n).padStart(2, "0")}</span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Brouillon gardé dans le navigateur : le client corrige son bassin après un contrôle bloquant, sans tout ressaisir. */
const BROUILLON = "dp-piscine-brouillon";
interface Brouillon {
  q: string;
  idus: string[];
  bassin: Bassin;
  photos?: Photos;
  contact: { prenom: string; nom: string; email: string; telephone: string };
  residence: "principale" | "secondaire";
}

function lireBrouillon(): Brouillon | null {
  try {
    const b = JSON.parse(localStorage.getItem(BROUILLON) ?? "null") as Brouillon | null;
    return b && typeof b.q === "string" && b.bassin && Array.isArray(b.idus) ? b : null;
  } catch {
    return null;
  }
}

function bassinInitial(p: ParcelleCandidate): Bassin {
  const contour = p.contours[0] ?? [];
  return {
    longueur: 8,
    largeur: 4,
    profondeur: 1.5,
    margelle: MARGELLE_DEFAUT_M,
    plage: { petit_cote_1: PLAGE_DEFAUT_M, petit_cote_2: PLAGE_DEFAUT_M, grand_cote_1: PLAGE_DEFAUT_M, grand_cote_2: PLAGE_DEFAUT_M },
    localTechnique: true,
    materiauLocal: "bois",
    type: "enterree",
    securite: "alarme",
    visibleRue: false,
    centre: centreContour(contour),
    angle: angleTerrain(contour),
  };
}

/**
 * DP piscine en ligne, faite par le client : son terrain, son bassin dessiné
 * sur la vue aérienne, ses coordonnées. Le dossier se prépare en 3 minutes ;
 * le client voit l'aperçu, puis paie pour le télécharger (page de suivi).
 */
export default function DpPiscine() {
  const [q, setQ] = useState("");
  const [recherche, setRecherche] = useState<RechercheTerrain | null>(null);
  const [erreurRecherche, setErreurRecherche] = useState<string | null>(null);
  const [cherche, setCherche] = useState(false);
  /** Parcelles du terrain : la première sert de référence (cartouche, dossier). */
  const [parcelles, setParcelles] = useState<ParcelleCandidate[]>([]);
  const [plusieurs, setPlusieurs] = useState(false);
  const parcelle = parcelles[0] ?? null;
  const [bassin, setBassinBrut] = useState<Bassin | null>(null);
  /** Étapes validées par le client : 1 emplacement, 2 coupe, 3 photomontage. */
  const [valide, setValide] = useState(0);
  const [vue, setVue] = useState<"plan" | "aerien">("plan");
  const [batis, setBatis] = useState<[number, number][][]>([]);
  /** Bassin encore à la place proposée (le client ne l'a pas déplacé) : on peut le replacer quand le bâti arrive. */
  const placeAuto = useRef(true);
  /** Un changement du bassin par le client : les étapes déjà validées sont à revoir. */
  const setBassin = (v: Bassin | null | ((b: Bassin | null) => Bassin | null), parLeClient = true) => {
    setBassinBrut(v);
    if (parLeClient) {
      placeAuto.current = false;
      setValide(0);
    }
  };
  const allerA = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  const [photos, setPhotos] = useState<Photos>({});
  const [contact, setContact] = useState({ prenom: "", nom: "", email: "", telephone: "", site_web: "" });
  const [residence, setResidence] = useState<"principale" | "secondaire">("principale");
  const [consentement, setConsentement] = useState(false);
  const [erreurs, setErreurs] = useState<ErreursDp>({});
  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const router = useRouter();

  /** Une parcelle touchée : elle remplace la sélection, ou s'ajoute / se retire si le terrain en compte plusieurs. */
  function choisir(p: ParcelleCandidate) {
    if (!plusieurs || !parcelles.length) {
      setParcelles([p]);
      placeAuto.current = true;
      setBassin(bassinInitial(p), false);
      setValide(0);
      return;
    }
    if (parcelles.some((x) => x.idu === p.idu)) {
      if (parcelles.length > 1) setParcelles(parcelles.filter((x) => x.idu !== p.idu));
    } else if (parcelles.length < 6) {
      const toutes = [...parcelles, p];
      setParcelles(toutes);
      // bassin qui ne tient pas sur le terrain agrandi : recentré sur la plus grande parcelle
      const anneauxT = toutes.flatMap((x) => x.contours);
      setBassin((b) => {
        if (!b || formesBassin(b).plage.every((pt) => dansTerrain(pt, anneauxT))) return b;
        const grande = toutes.reduce((g, x) => (x.contenance > g.contenance ? x : g));
        const { centre, angle } = bassinInitial(grande);
        return { ...b, centre, angle };
      }, false);
    }
  }

  async function chercher(texte: string, reprise?: Brouillon) {
    setQ(texte);
    setCherche(true);
    setErreurRecherche(null);
    try {
      const r = await fetch(`/api/planche-gratuite/terrain?${new URLSearchParams({ q: texte })}`);
      const json = await r.json();
      if (!json.ok) {
        setRecherche(null);
        setErreurRecherche(json.error ?? "Recherche impossible.");
        return;
      }
      setRecherche(json as RechercheTerrain);
      const liste = json.parcelles as ParcelleCandidate[];
      const deja = reprise ? reprise.idus.map((i) => liste.find((x) => x.idu === i)).filter((x): x is ParcelleCandidate => Boolean(x)) : [];
      if (deja.length && reprise) {
        setParcelles(deja);
        setPlusieurs(deja.length > 1);
        placeAuto.current = false;
        setBassin(reprise.bassin, false);
        setPhotos(reprise.photos ?? {});
      } else if (liste[0]) {
        setParcelles([liste[0]]);
        placeAuto.current = true;
        setBassin(bassinInitial(liste[0]), false);
      }
      trackEvent("dp_piscine_terrain", {});
    } catch {
      setErreurRecherche("Recherche impossible. Vérifiez votre connexion.");
    } finally {
      setCherche(false);
    }
  }

  // Retour depuis la page de suivi (« Corriger mon bassin ») : on reprend le brouillon.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reprendre") !== "1") return;
    const b = lireBrouillon();
    if (!b) return;
    setContact((c) => ({ ...c, ...b.contact }));
    setResidence(b.residence);
    void chercher(b.q, b);
    // une seule fois, à l'arrivée sur la page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anneaux = parcelles.flatMap((p) => p.contours);
  const cleTerrain = parcelles.map((p) => p.idu).join(",");

  // Bâtiments autour du terrain (BD TOPO) : dessinés sur le plan, et premier emplacement hors de la maison.
  useEffect(() => {
    const pts = parcelles.flatMap((p) => p.contours.flat());
    if (!pts.length) return;
    const ctl = new AbortController();
    const m = 0.0004;
    const bbox = [Math.min(...pts.map((q) => q[0])) - m, Math.min(...pts.map((q) => q[1])) - m, Math.max(...pts.map((q) => q[0])) + m, Math.max(...pts.map((q) => q[1])) + m];
    fetch(`/api/dp-piscine/bati?${new URLSearchParams({ bbox: bbox.map((v) => v.toFixed(6)).join(",") })}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((j: { batiments?: [number, number][][] }) => {
        const bt = j.batiments ?? [];
        setBatis(bt);
        const ann = parcelles.flatMap((p) => p.contours);
        if (placeAuto.current) setBassinBrut((b) => (b ? { ...b, ...placementInitial(b, ann, bt) } : b));
      })
      .catch(() => setBatis([]));
    return () => ctl.abort();
    // la clé du terrain résume la sélection des parcelles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleTerrain]);
  const distance = bassin && anneaux.length ? distanceLimites(formesBassin(bassin).bassin, anneaux) : null;
  const depasse = Boolean(bassin && anneaux.length && formesBassin(bassin).plage.some((pt) => !dansTerrain(pt, anneaux)));
  const contenance = parcelles.reduce((s, p) => s + p.contenance, 0);
  const photosManquantes = Boolean(bassin?.visibleRue && !photosCompletes(photos));
  const empiete = Boolean(bassin && surBati(formesBassin(bassin).plage, batis));
  const emplacementOk = Boolean(parcelle && bassin && regimeIndicatif(bassin) === "dp" && !depasse && !empiete);
  const etapesFaites = valide >= (bassin?.visibleRue ? 3 : 2);
  const pret = emplacementOk && etapesFaites && !photosManquantes;
  const voisines = (recherche?.parcelles ?? []).filter((p) => !parcelles.some((x) => x.idu === p.idu)).flatMap((p) => p.contours);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!recherche || !parcelle || !bassin) return;
    setEnvoi(true);
    setErreurs({});
    setErreurEnvoi(null);
    try {
      const { prenom, nom, email, telephone } = contact;
      localStorage.setItem(BROUILLON, JSON.stringify({ q, idus: parcelles.map((p) => p.idu), bassin, photos, contact: { prenom, nom, email, telephone }, residence } satisfies Brouillon));
    } catch {
      /* navigation privée : pas de brouillon, le client ressaisira */
    }
    try {
      const r = await fetch("/api/dp-piscine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idus: parcelles.map((p) => p.idu),
          voie: recherche.adresse.voie,
          ville: recherche.adresse.ville,
          commune: parcelle.commune,
          ...contact,
          residence,
          consentement,
          bassin,
          photos: bassin.visibleRue ? photos : {},
        }),
      });
      const json = await r.json();
      if (json.ok && json.id) {
        trackEvent("dp_piscine_lancee", {});
        router.push(`/dp-piscine/suivi?${new URLSearchParams({ id: json.id, k: json.k })}`);
        return;
      }
      if (json.erreurs) setErreurs(json.erreurs);
      else setErreurEnvoi(json.error ?? "L'envoi a échoué.");
    } catch {
      setErreurEnvoi("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    }
    setEnvoi(false);
  }

  return (
    <div className="grid gap-10">
      <Etape n={1} titre="Votre terrain">
        <form onSubmit={(e) => { e.preventDefault(); void chercher(q); }} className="field" role="search">
          <label htmlFor="dp-adresse">Adresse du terrain</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <ChampAdresse id="dp-adresse" className="min-h-12" value={q} onChange={setQ} onChoisir={(a) => void chercher(a)} placeholder="12 rue des Lilas 76600 Le Havre" required minLength={5} />
            <button type="submit" className="btn btn-ink shrink-0" disabled={cherche}>{cherche ? "Recherche…" : "Trouver mon terrain"}</button>
          </div>
          {erreurRecherche && <p role="alert" className="text-sm text-alert">{erreurRecherche}</p>}
        </form>
        {recherche && (
          <div className="grid gap-3">
            <div className="max-w-3xl">
              <CarteParcelles parcelles={recherche.parcelles} choisie={parcelle?.idu ?? ""} aussi={parcelles.slice(1).map((p) => p.idu)} onChoisir={choisir} />
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-[0.95rem]">
              <input
                type="checkbox"
                className="accent-ink mt-1 h-4 w-4"
                checked={plusieurs}
                onChange={(e) => {
                  setPlusieurs(e.target.checked);
                  if (!e.target.checked) setParcelles(parcelles.slice(0, 1));
                }}
              />
              <span>
                Mon terrain compte plusieurs parcelles
                <span className="block text-sm text-ink-2">Touchez-les toutes sur la carte (touchez de nouveau pour en retirer une).</span>
              </span>
            </label>
            {parcelle && (
              <p className="text-[0.95rem]" aria-live="polite">
                <strong>
                  {parcelles.length > 1 ? "Parcelles " : "Parcelle "}
                  {parcelles.map((p) => referenceCourte(p.idu)).join(", ")}
                </strong>{" "}
                · {contenance.toLocaleString("fr-FR")} m² · {parcelle.commune}
                {!plusieurs && <span className="block text-sm text-ink-2">Ce n&apos;est pas votre terrain ? Touchez la bonne parcelle sur la carte.</span>}
              </p>
            )}
          </div>
        )}
      </Etape>

      <Etape n={2} titre="Placez votre piscine" actif={Boolean(bassin)}>
        {parcelle && bassin && (
          <div id="dp-etape-2" className="grid scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="grid content-start gap-3">
              <div className="flex gap-2" role="tablist" aria-label="Vue du terrain">
                {(["plan", "aerien"] as const).map((v) => (
                  <button key={v} type="button" role="tab" aria-selected={vue === v} className={`btn min-h-10 px-4 ${vue === v ? "btn-ink" : "btn-line"}`} onClick={() => setVue(v)}>
                    {v === "plan" ? "Plan de masse coté" : "Vue aérienne"}
                  </button>
                ))}
              </div>
              {vue === "plan" ? (
                <PlanMasseLive anneaux={anneaux} voisines={voisines} batis={batis} bassin={bassin} onChange={(b) => setBassin(b)} />
              ) : (
                <CartePiscine
                  key={parcelles.map((p) => p.idu).join("-")}
                  contours={anneaux}
                  bassin={bassin}
                  onDeplacer={(centre) => setBassin((b) => (b ? { ...b, centre } : b))}
                  distance={distance}
                  tropPres={Boolean(distance && distance.d < RECUL_CONSEILLE_M)}
                />
              )}
            </div>
            <div className="grid content-start gap-6">
              <ReglagesBassin bassin={bassin} onChange={(b) => setBassin(b)} depasse={depasse} distance={distance?.d ?? null} />
              {empiete && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">Le bassin ou sa plage touche un bâtiment : déplacez-le.</p>}
              <div>
                <button type="button" className="btn btn-ink" disabled={!emplacementOk || valide >= 1} onClick={() => { setValide(1); trackEvent("dp_piscine_etape", { etape: "emplacement" }); allerA("dp-etape-3"); }}>
                  {valide >= 1 ? "Emplacement validé ✓" : "Je valide l'emplacement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Etape>

      <Etape n={3} titre="Vérifiez la coupe sur votre terrain" actif={valide >= 1}>
        <div id="dp-etape-3" className="grid scroll-mt-24 gap-5">
          {valide >= 1 && bassin && <CoupeLive anneaux={anneaux} bassin={bassin} />}
          {valide >= 1 && bassin && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="field">
                <label htmlFor="dp-prof2">Profondeur (m)</label>
                <input id="dp-prof2" type="number" inputMode="decimal" min={0.6} max={3} step={0.05} className="min-h-12 w-28" value={bassin.profondeur}
                  onChange={(e) => { const n = Number(e.target.value); if (n >= 0.6 && n <= 3) setBassinBrut({ ...bassin, profondeur: n }); }} />
              </div>
              <button type="button" className="btn btn-ink" disabled={valide >= 2} onClick={() => { setValide(2); trackEvent("dp_piscine_etape", { etape: "coupe" }); allerA(bassin.visibleRue ? "dp-etape-4" : "dp-etape-5"); }}>
                {valide >= 2 ? "Coupe validée ✓" : "Je valide la coupe"}
              </button>
            </div>
          )}
        </div>
      </Etape>

      {bassin?.visibleRue && (
        <Etape n={4} titre="Photos et photomontage" actif={valide >= 2}>
          <div id="dp-etape-4" className="grid scroll-mt-24 gap-5">
            <PhotosDp photos={photos} onChange={(p) => { setPhotos(p); if (valide >= 3) setValide(2); }} bassin={bassin} />
            <div>
              <button type="button" className="btn btn-ink" disabled={!photosCompletes(photos) || valide >= 3} onClick={() => { setValide(3); trackEvent("dp_piscine_etape", { etape: "photomontage" }); allerA("dp-etape-5"); }}>
                {valide >= 3 ? "Photomontage validé ✓" : "Je valide le photomontage"}
              </button>
            </div>
          </div>
        </Etape>
      )}

      <form onSubmit={envoyer} className="grid gap-10" noValidate>
        <Etape n={bassin?.visibleRue ? 5 : 4} titre="Vos coordonnées (le déclarant)" actif={pret}>
          <span id="dp-etape-5" className="-mt-5 block scroll-mt-24" aria-hidden="true" />
          <div className="grid gap-6 sm:grid-cols-2">
            {([["prenom", "Prénom", "given-name"], ["nom", "Nom", "family-name"], ["email", "E-mail", "email"], ["telephone", "Téléphone (facultatif)", "tel"]] as const).map(([k, label, auto]) => (
              <div key={k} className="field">
                <label htmlFor={`dp-${k}`}>{label}</label>
                <input id={`dp-${k}`} type={k === "email" ? "email" : k === "telephone" ? "tel" : "text"} className="min-h-12" autoComplete={auto} value={contact[k]} onChange={(e) => setContact({ ...contact, [k]: e.target.value })} aria-invalid={Boolean(erreurs[k])} />
                {erreurs[k] && <p className="text-sm text-alert">{erreurs[k]}</p>}
              </div>
            ))}
            <input type="text" name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={contact.site_web} onChange={(e) => setContact({ ...contact, site_web: e.target.value })} />
          </div>
          <fieldset className="flex flex-wrap gap-6 text-[0.95rem]">
            <legend className="mb-2 text-sm font-bold">La piscine est pour</legend>
            {(["principale", "secondaire"] as const).map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="dp-residence" className="accent-ink" checked={residence === r} onChange={() => setResidence(r)} />
                votre résidence {r}
              </label>
            ))}
          </fieldset>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="accent-ink mt-1 h-4 w-4 shrink-0" />
            <span className="text-[0.95rem] leading-relaxed">
              J&apos;accepte qu&apos;ID Maîtrise utilise ces informations pour préparer mon dossier et me recontacter à son sujet. Voir la{" "}
              <Link href="/confidentialite" className={lien}>politique de confidentialité</Link>.
            </span>
          </label>
          {(erreurs.consentement || erreurs.bassin || erreurs.idu || erreurs.photos) && (
            <p role="alert" className="text-sm text-alert">{erreurs.consentement ?? erreurs.bassin ?? erreurs.idu ?? erreurs.photos}</p>
          )}
          {photosManquantes && <p className="text-sm text-ink-2">Piscine visible de la rue : ajoutez la photo de près, la photo de loin et les 4 coins du bassin (étape 2).</p>}
          {erreurEnvoi && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{erreurEnvoi}</p>}
          <div className="grid gap-2">
            <div><button type="submit" className="btn btn-ink" disabled={!pret || envoi}>{envoi ? "Envoi…" : "Préparer mon dossier"}</button></div>
            <p className="text-sm text-ink-2">Gratuit jusqu&apos;à l&apos;aperçu : vous ne payez ({PRIX_DP_PISCINE_TTC} € TTC) que si le dossier vous convient.</p>
          </div>
        </Etape>
      </form>
    </div>
  );
}
