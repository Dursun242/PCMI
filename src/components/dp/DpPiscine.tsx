"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import ChampAdresse from "@/components/ChampAdresse";
import CarteParcelles from "@/components/planche/CarteParcelles";
import PhotosDp from "@/components/dp/PhotosDp";
import ReglagesBassin from "@/components/dp/ReglagesBassin";
import { trackEvent } from "@/lib/analytics";
import { PRIX_DP_PISCINE_TTC, RECUL_CONSEILLE_M, photosCompletes, type PhotosDp as Photos, angleTerrain, distanceLimites, centreContour, dansTerrain, formesBassin, regimeIndicatif, type Bassin, type ErreursDp } from "@/lib/dpPiscine";
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
    margelle: 0.3,
    plage: { petit_cote_1: 1, petit_cote_2: 1, grand_cote_1: 1, grand_cote_2: 1 },
    localTechnique: true,
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
  const [bassin, setBassin] = useState<Bassin | null>(null);
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
      setBassin(bassinInitial(p));
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
      });
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
        setBassin(reprise.bassin);
        setPhotos(reprise.photos ?? {});
      } else if (liste[0]) {
        setParcelles([liste[0]]);
        setBassin(bassinInitial(liste[0]));
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
  }, []);

  const anneaux = parcelles.flatMap((p) => p.contours);
  const distance = bassin && anneaux.length ? distanceLimites(formesBassin(bassin).bassin, anneaux) : null;
  const depasse = Boolean(bassin && anneaux.length && formesBassin(bassin).plage.some((pt) => !dansTerrain(pt, anneaux)));
  const contenance = parcelles.reduce((s, p) => s + p.contenance, 0);
  const photosManquantes = Boolean(bassin?.visibleRue && !photosCompletes(photos));
  const pret = Boolean(parcelle && bassin && regimeIndicatif(bassin) === "dp" && !depasse && !photosManquantes);

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

      <Etape n={2} titre="Votre piscine" actif={Boolean(bassin)}>
        {parcelle && bassin && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <CartePiscine
              key={parcelles.map((p) => p.idu).join("-")}
              contours={anneaux}
              bassin={bassin}
              onDeplacer={(centre) => setBassin((b) => (b ? { ...b, centre } : b))}
              distance={distance}
              tropPres={Boolean(distance && distance.d < RECUL_CONSEILLE_M)}
            />
            <ReglagesBassin bassin={bassin} onChange={setBassin} depasse={depasse} distance={distance?.d ?? null} />
          </div>
        )}
        {bassin?.visibleRue && <PhotosDp photos={photos} onChange={setPhotos} />}
      </Etape>

      <form onSubmit={envoyer} className="grid gap-10" noValidate>
        <Etape n={3} titre="Vos coordonnées (le déclarant)" actif={pret}>
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
