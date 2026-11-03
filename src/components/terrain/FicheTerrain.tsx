"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import ChampAdresse from "@/components/ChampAdresse";
import CarteParcelles from "@/components/planche/CarteParcelles";
import { trackEvent } from "@/lib/analytics";
import type { Apercu, ErreursFiche, Niveau } from "@/lib/ficheTerrain";
import { referenceCourte, type ParcelleCandidate, type RechercheTerrain } from "@/lib/planche";

const etiquette = "text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze";
const lien = "text-ink underline decoration-brass underline-offset-4";

/** Couleur et mot de chaque niveau : la couleur n'est jamais seule à porter l'information. */
const NIVEAUX: Record<Niveau, { mot: string; pastille: string; bord: string }> = {
  favorable: { mot: "Favorable", pastille: "bg-[#3f6b4a]", bord: "border-[#3f6b4a]" },
  info: { mot: "À savoir", pastille: "bg-ink-3", bord: "border-ink-3" },
  vigilance: { mot: "Vigilance", pastille: "bg-[#c78c1f]", bord: "border-[#c78c1f]" },
  alerte: { mot: "Alerte", pastille: "bg-alert", bord: "border-alert" },
  inconnu: { mot: "Non connu", pastille: "bg-stone-2", bord: "border-stone-2" },
};

type Envoi = { t: "saisie" } | { t: "envoi" } | { t: "envoye" } | { t: "erreur"; message: string };

function Etape({ n, titre, children, actif = true }: { n: number; titre: string; children: React.ReactNode; actif?: boolean }) {
  return (
    <section className={`grid gap-5 border-t border-stone-2 pt-7 transition-opacity duration-300 ${actif ? "" : "opacity-40"}`} inert={!actif}>
      <h3 className="flex items-baseline gap-4 text-xl font-bold">
        <span className="numeral text-base font-bold tracking-[0.15em] text-bronze" aria-hidden="true">{String(n).padStart(2, "0")}</span>
        {titre}
      </h3>
      {children}
    </section>
  );
}

function ApercuTerrain({ a }: { a: Apercu }) {
  const z = NIVEAUX[a.zone.niveau];
  return (
    <div className="grid gap-4" aria-live="polite">
      <div className={`border-l-4 ${z.bord} bg-paper px-5 py-4`}>
        <p className={etiquette}>Urbanisme · {z.mot}</p>
        <p className="display mt-1 text-2xl sm:text-3xl">{a.zone.titre}</p>
        <p className="mt-1 text-[0.95rem] text-ink-2">{a.zone.detail}</p>
      </div>
      <ul className="grid gap-px overflow-hidden border border-stone-2 bg-stone-2 sm:grid-cols-2">
        {a.voyants.slice(1).map((v) => {
          const n = NIVEAUX[v.niveau];
          return (
            <li key={v.cle} className="grid grid-cols-[auto_1fr] gap-x-3 bg-paper px-4 py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${n.pastille}`} aria-hidden="true" />
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-bold">{v.titre}</span>
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-2">{n.mot}</span>
              </p>
              <p className="col-start-2 text-sm leading-relaxed text-ink-2">{v.resume}</p>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-ink-2">
        Données publiques du Géoportail de l&apos;urbanisme et de Géorisques. Indicatif : seul un certificat d&apos;urbanisme
        fait foi.
      </p>
    </div>
  );
}

/**
 * Fiche terrain : l'aperçu (zone et risques) s'affiche tout de suite, sans
 * inscription ; la fiche complète, avec ce que ça change pour le projet et les
 * liens vers le règlement, part en PDF contre le nom et l'e-mail.
 */
export default function FicheTerrain() {
  const [q, setQ] = useState("");
  const [recherche, setRecherche] = useState<RechercheTerrain | null>(null);
  const [erreurRecherche, setErreurRecherche] = useState<string | null>(null);
  const [cherche, setCherche] = useState(false);
  const [parcelle, setParcelle] = useState<ParcelleCandidate | null>(null);
  const idu = parcelle?.idu ?? "";
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [charge, setCharge] = useState(false);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [contact, setContact] = useState({ prenom: "", nom: "", email: "", site_web: "" });
  const [consentement, setConsentement] = useState(false);
  const [erreurs, setErreurs] = useState<ErreursFiche>({});
  const [envoi, setEnvoi] = useState<Envoi>({ t: "saisie" });


  async function chercher(texte: string) {
    setQ(texte);
    setCherche(true);
    setErreurRecherche(null);
    setApercu(null);
    try {
      const r = await fetch(`/api/planche-gratuite/terrain?${new URLSearchParams({ q: texte })}`);
      const json = await r.json();
      if (!json.ok) {
        setRecherche(null);
        setErreurRecherche(json.error ?? "Recherche impossible.");
        return;
      }
      setRecherche(json as RechercheTerrain);
      setParcelle(json.parcelles[0] ?? null);
    } catch {
      setErreurRecherche("Recherche impossible. Vérifiez votre connexion.");
    } finally {
      setCherche(false);
    }
  }

  // Arrivée avec ?adresse=… (accueil, liens partagés) : la recherche part toute seule.
  useEffect(() => {
    const adresse = new URLSearchParams(window.location.search).get("adresse")?.trim();
    if (adresse && adresse.length >= 3) void chercher(adresse.slice(0, 200));
  }, []);

  // Chaque parcelle choisie : son aperçu. Une réponse en retard (autre parcelle) est ignorée.
  useEffect(() => {
    if (!idu) return;
    const ctrl = new AbortController();
    setCharge(true);
    setErreurApercu(null);
    setApercu(null);
    fetch(`/api/fiche-terrain?${new URLSearchParams({ idu })}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) {
          setErreurApercu(json.error ?? "Aperçu impossible.");
          return;
        }
        const a = json.apercu as Apercu;
        setApercu(a);
        trackEvent("fiche_terrain_apercu", {
          zone: a.zone.niveau,
          alertes: String(a.voyants.filter((v) => v.niveau === "alerte").length),
        });
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setErreurApercu("Aperçu impossible. Vérifiez votre connexion.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setCharge(false);
      });
    return () => ctrl.abort();
  }, [idu]);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!parcelle) return;
    setEnvoi({ t: "envoi" });
    setErreurs({});
    try {
      const r = await fetch("/api/fiche-terrain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idu: parcelle.idu, adresse: recherche?.adresse.label ?? "", ...contact, consentement }),
      });
      const json = await r.json();
      if (json.ok) {
        setEnvoi({ t: "envoye" });
        trackEvent("fiche_terrain_demande", { zone: apercu?.zone.niveau ?? "inconnu" });
      } else if (json.erreurs) {
        setErreurs(json.erreurs);
        setEnvoi({ t: "saisie" });
      } else {
        setEnvoi({ t: "erreur", message: json.error ?? "L'envoi a échoué." });
      }
    } catch {
      setEnvoi({ t: "erreur", message: "L'envoi a échoué. Vérifiez votre connexion et réessayez." });
    }
  }

  return (
    <div className="grid gap-10">
      <Etape n={1} titre="Votre terrain">
        <form onSubmit={(e) => { e.preventDefault(); void chercher(q); }} className="field" role="search">
          <label htmlFor="ft-adresse">Adresse du terrain</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <ChampAdresse
              id="ft-adresse"
              className="min-h-12"
              value={q}
              onChange={setQ}
              onChoisir={(a) => void chercher(a)}
              placeholder="12 rue des Lilas 76600 Le Havre"
              required
              minLength={5}
            />
            <button type="submit" className="btn btn-ink shrink-0" disabled={cherche}>
              {cherche ? "Recherche…" : "Analyser mon terrain"}
            </button>
          </div>
          {erreurRecherche && <p role="alert" className="text-sm text-alert">{erreurRecherche}</p>}
        </form>

        {recherche && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10">
            <div className="grid gap-3">
              <CarteParcelles parcelles={recherche.parcelles} choisie={idu} onChoisir={setParcelle} />
              {parcelle && (
                <p className="text-[0.95rem]">
                  <strong>Parcelle {referenceCourte(parcelle.idu)}</strong> · {parcelle.contenance.toLocaleString("fr-FR")} m² ·{" "}
                  {parcelle.commune}
                  <span className="block text-sm text-ink-2">Ce n&apos;est pas votre terrain ? Faites glisser ou zoomez la carte, puis touchez la bonne parcelle.</span>
                </p>
              )}
            </div>
            <div>
              {charge && <p className="animate-pulse border-l-4 border-stone-2 bg-paper px-5 py-6 text-ink-2">Lecture du PLU et des risques…</p>}
              {erreurApercu && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{erreurApercu}</p>}
              {apercu && <ApercuTerrain a={apercu} />}
            </div>
          </div>
        )}
      </Etape>

      <Etape n={2} titre="La fiche complète, en PDF" actif={Boolean(apercu)}>
        {envoi.t === "envoye" ? (
          <div role="status" className="grid gap-3 border-l-2 border-brass py-2 pl-6">
            <p className={etiquette}>Fiche envoyée</p>
            <p className="display text-3xl">Regardez votre boîte e-mail.</p>
            <p className="max-w-[56ch] leading-relaxed text-ink-2">
              La fiche de la parcelle {apercu?.reference} est partie à {contact.email}. Pensez à regarder dans les
              indésirables.
            </p>
            <p className="max-w-[56ch] leading-relaxed">
              Le terrain vous plaît ? Nous montons votre dossier de permis complet, à prix fixe.{" "}
              <Link href="/tarifs" className={lien} onClick={() => trackEvent("cta_click", { source: "fiche_terrain" })}>Voir les formules</Link>
              {" "}ou{" "}
              <Link href="/plans-gratuits" className={lien}>recevez un plan gratuit du terrain</Link>.
            </p>
          </div>
        ) : (
          <form onSubmit={envoyer} className="grid gap-6" noValidate>
            <ul className="grid gap-2 text-[0.95rem] sm:grid-cols-2">
              {[
                `Ce que ça change pour votre projet${apercu ? ` (${apercu.points} points)` : ""}`,
                "Le détail du PLU : document, zone, servitudes, prescriptions",
                "Le détail des risques et les cavités recensées autour",
                "Le lien direct vers le règlement de votre zone",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2.5 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="ft-prenom">Prénom</label>
                <input id="ft-prenom" className="min-h-12" autoComplete="given-name" value={contact.prenom} onChange={(e) => setContact({ ...contact, prenom: e.target.value })} aria-invalid={Boolean(erreurs.prenom)} />
                {erreurs.prenom && <p className="text-sm text-alert">{erreurs.prenom}</p>}
              </div>
              <div className="field">
                <label htmlFor="ft-nom">Nom</label>
                <input id="ft-nom" className="min-h-12" autoComplete="family-name" value={contact.nom} onChange={(e) => setContact({ ...contact, nom: e.target.value })} aria-invalid={Boolean(erreurs.nom)} />
                {erreurs.nom && <p className="text-sm text-alert">{erreurs.nom}</p>}
              </div>
              <div className="field sm:col-span-2">
                <label htmlFor="ft-email">E-mail</label>
                <input id="ft-email" type="email" className="min-h-12" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} aria-invalid={Boolean(erreurs.email)} />
                <p className="hint">La fiche part tout de suite à cette adresse, en PDF.</p>
                {erreurs.email && <p className="text-sm text-alert">{erreurs.email}</p>}
              </div>
              {/* Pot de miel, invisible pour un humain. */}
              <input type="text" name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={contact.site_web} onChange={(e) => setContact({ ...contact, site_web: e.target.value })} />
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="accent-ink mt-1 h-4 w-4 shrink-0" />
              <span className="text-[0.95rem] leading-relaxed">
                J&apos;accepte qu&apos;ID Maîtrise utilise ces informations pour m&apos;envoyer la fiche et me recontacter au
                sujet de mon projet. Voir la <Link href="/confidentialite" className={lien}>politique de confidentialité</Link>.
              </span>
            </label>
            {erreurs.consentement && <p className="text-sm text-alert">{erreurs.consentement}</p>}
            {erreurs.idu && <p role="alert" className="text-sm text-alert">{erreurs.idu}</p>}
            {envoi.t === "erreur" && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{envoi.message}</p>}
            <div>
              <button type="submit" className="btn btn-ink" disabled={!apercu || envoi.t === "envoi"}>
                {envoi.t === "envoi" ? "Préparation de la fiche…" : "Recevoir ma fiche terrain gratuite"}
              </button>
            </div>
          </form>
        )}
      </Etape>
    </div>
  );
}
