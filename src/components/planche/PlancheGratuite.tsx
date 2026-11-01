"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import ChampAdresse from "@/components/ChampAdresse";
import CarteParcelles from "@/components/planche/CarteParcelles";
import { trackEvent } from "@/lib/analytics";
import {
  ORDRE_PLANCHES,
  PLANCHES,
  referenceCourte,
  type ErreursDemande,
  type Planche,
  type RechercheTerrain,
} from "@/lib/planche";

type Etat = { t: "saisie" } | { t: "envoi" } | { t: "envoye"; manuel: boolean } | { t: "deja" } | { t: "erreur"; message: string };

const etiquette = "text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze";
const lien = "text-ink underline decoration-brass underline-offset-4";

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

/**
 * Formulaire de la planche gratuite : trouver le terrain, confirmer la parcelle
 * sur la carte, choisir la planche, donner son nom et son e-mail. La planche
 * arrive par e-mail, dessinée par l'outil PCMI d'ID Maîtrise.
 */
export default function PlancheGratuite({ planchePage }: { planchePage: Planche }) {
  const [q, setQ] = useState("");
  const [recherche, setRecherche] = useState<RechercheTerrain | null>(null);
  const [erreurRecherche, setErreurRecherche] = useState<string | null>(null);
  const [cherche, setCherche] = useState(false);
  const [idu, setIdu] = useState("");
  const [planche, setPlanche] = useState<Planche>(planchePage);
  const [contact, setContact] = useState({ prenom: "", nom: "", email: "", site_web: "" });
  const [consentement, setConsentement] = useState(false);
  const [erreurs, setErreurs] = useState<ErreursDemande>({});
  const [etat, setEtat] = useState<Etat>({ t: "saisie" });

  const parcelle = recherche?.parcelles.find((p) => p.idu === idu);

  async function chercher(texte: string) {
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
      setIdu(json.parcelles[0]?.idu ?? "");
      trackEvent("planche_terrain_trouve", { parcelles: String(Math.min(json.parcelles.length, 10)) });
    } catch {
      setErreurRecherche("Recherche impossible. Vérifiez votre connexion.");
    } finally {
      setCherche(false);
    }
  }

  function trouver(e: FormEvent) {
    e.preventDefault();
    void chercher(q);
  }

  // Arrivée depuis le bloc de l'accueil (?adresse=…) : la recherche du terrain part toute seule.
  useEffect(() => {
    const adresse = new URLSearchParams(window.location.search).get("adresse")?.trim();
    if (adresse && adresse.length >= 3) void chercher(adresse.slice(0, 200));
  }, []);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!recherche || !parcelle) return;
    setEtat({ t: "envoi" });
    setErreurs({});
    try {
      const r = await fetch("/api/planche-gratuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planche,
          idu: parcelle.idu,
          voie: recherche.adresse.voie,
          ville: recherche.adresse.ville,
          commune: parcelle.commune,
          ...contact,
          consentement,
        }),
      });
      const json = await r.json();
      if (json.ok) {
        setEtat({ t: "envoye", manuel: Boolean(json.manuel) });
        trackEvent("planche_demande", { planche, resultat: "envoyee" });
      } else if (json.deja) {
        setEtat({ t: "deja" });
        trackEvent("planche_demande", { planche, resultat: "deja_servie" });
      } else if (json.erreurs) {
        setErreurs(json.erreurs);
        setEtat({ t: "saisie" });
      } else {
        setEtat({ t: "erreur", message: json.error ?? "L'envoi a échoué." });
      }
    } catch {
      setEtat({ t: "erreur", message: "L'envoi a échoué. Vérifiez votre connexion et réessayez." });
    }
  }

  if (etat.t === "envoye") {
    return (
      <div role="status" className="grid gap-4 border-l-2 border-brass py-2 pl-6">
        <p className={etiquette}>Demande reçue</p>
        <p className="display text-4xl">C&apos;est parti.</p>
        <p className="max-w-[56ch] leading-relaxed text-ink-2">
          {etat.manuel
            ? "Votre planche demande une vérification de notre part : nous la préparons et vous l'envoyons par e-mail sous 24 h ouvrées."
            : `Votre planche « ${PLANCHES[planche].titre} » est en cours de dessin. Elle arrive par e-mail à ${contact.email} d'ici quelques minutes ; pensez à regarder dans les indésirables.`}
        </p>
        <p className="max-w-[56ch] leading-relaxed">
          Vous préparez un permis sur ce terrain ? Nous montons le dossier complet, à prix fixe.{" "}
          <Link href="/tarifs" className={lien} onClick={() => trackEvent("cta_click", { source: "planche_gratuite" })}>
            Voir les formules
          </Link>
        </p>
      </div>
    );
  }

  if (etat.t === "deja") {
    return (
      <div role="alert" className="grid gap-4 border-l-2 border-alert py-2 pl-6">
        <p className="display text-4xl">Ce terrain a déjà eu sa planche.</p>
        <p className="max-w-[56ch] leading-relaxed text-ink-2">
          La planche gratuite est limitée à une seule par parcelle. Pour les autres plans de votre terrain, ou pour votre
          dossier de permis complet, écrivez-nous : nous vous répondons sous 4 h ouvrées.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className="btn btn-ink">Nous écrire</Link>
          <Link href="/tarifs" className="btn btn-line">Voir les formules</Link>
        </div>
      </div>
    );
  }

  const choixFait = Boolean(parcelle);

  return (
    <div className="grid gap-10">
      <Etape n={1} titre="Votre terrain">
        <form onSubmit={trouver} className="field" role="search">
          <label htmlFor="pg-adresse">Adresse du terrain</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <ChampAdresse
              id="pg-adresse"
              className="min-h-12"
              value={q}
              onChange={setQ}
              onChoisir={(a) => void chercher(a)}
              placeholder="12 rue des Lilas 76600 Le Havre"
              required
              minLength={5}
            />
            <button type="submit" className="btn btn-ink shrink-0" disabled={cherche}>
              {cherche ? "Recherche…" : "Trouver mon terrain"}
            </button>
          </div>
          {erreurRecherche && <p role="alert" className="text-sm text-alert">{erreurRecherche}</p>}
        </form>

        {recherche && (
          <div className="grid gap-3">
            <div className="max-w-3xl"><CarteParcelles parcelles={recherche.parcelles} choisie={idu} onChoisir={setIdu} /></div>
            {parcelle && (
              <p className="text-[0.95rem]" aria-live="polite">
                <strong>Parcelle {referenceCourte(parcelle.idu)}</strong> · {parcelle.contenance.toLocaleString("fr-FR")} m² ·{" "}
                {parcelle.commune}
                <span className="block text-sm text-ink-2">
                  Ce n&apos;est pas votre terrain ? Touchez la bonne parcelle sur la carte.
                </span>
              </p>
            )}
          </div>
        )}
      </Etape>

      <form onSubmit={envoyer} className="grid gap-10" noValidate>
        <Etape n={2} titre="Votre planche, au choix" actif={choixFait}>
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Planche</legend>
            {ORDRE_PLANCHES.map((p) => (
              <label
                key={p}
                className="group relative flex cursor-pointer flex-col gap-2 border border-stone-2 bg-paper p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-ink-3 has-[:checked]:border-ink has-[:checked]:shadow-[inset_0_-3px_0_0_var(--color-brass)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bronze"
              >
                <input type="radio" name="pg-planche" value={p} checked={planche === p} onChange={() => setPlanche(p)} className="sr-only" />
                <span className="font-bold">{PLANCHES[p].titre}</span>
                <span className="text-sm leading-relaxed text-ink-2">{PLANCHES[p].contenu}</span>
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-ink-2">Une seule planche gratuite par terrain : choisissez celle qui vous sert le plus.</p>
        </Etape>

        <Etape n={3} titre="Où vous l'envoyer" actif={choixFait}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="pg-prenom">Prénom</label>
              <input id="pg-prenom" className="min-h-12" autoComplete="given-name" value={contact.prenom} onChange={(e) => setContact({ ...contact, prenom: e.target.value })} aria-invalid={Boolean(erreurs.prenom)} />
              {erreurs.prenom && <p className="text-sm text-alert">{erreurs.prenom}</p>}
            </div>
            <div className="field">
              <label htmlFor="pg-nom">Nom</label>
              <input id="pg-nom" className="min-h-12" autoComplete="family-name" value={contact.nom} onChange={(e) => setContact({ ...contact, nom: e.target.value })} aria-invalid={Boolean(erreurs.nom)} />
              {erreurs.nom && <p className="text-sm text-alert">{erreurs.nom}</p>}
            </div>
            <div className="field sm:col-span-2">
              <label htmlFor="pg-email">E-mail</label>
              <input id="pg-email" type="email" className="min-h-12" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} aria-invalid={Boolean(erreurs.email)} />
              <p className="hint">La planche est envoyée à cette adresse, en PDF.</p>
              {erreurs.email && <p className="text-sm text-alert">{erreurs.email}</p>}
            </div>
            {/* Pot de miel, invisible pour un humain. */}
            <input type="text" name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={contact.site_web} onChange={(e) => setContact({ ...contact, site_web: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="accent-ink mt-1 h-4 w-4 shrink-0" />
            <span className="text-[0.95rem] leading-relaxed">
              J&apos;accepte qu&apos;ID Maîtrise utilise ces informations pour m&apos;envoyer la planche et me recontacter au
              sujet de mon projet. Voir la{" "}
              <Link href="/confidentialite" className={lien}>politique de confidentialité</Link>.
            </span>
          </label>
          {erreurs.consentement && <p className="text-sm text-alert">{erreurs.consentement}</p>}
          {(erreurs.idu || erreurs.voie || erreurs.ville) && (
            <p role="alert" className="text-sm text-alert">{erreurs.idu ?? erreurs.voie ?? erreurs.ville}</p>
          )}
          {etat.t === "erreur" && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{etat.message}</p>}
          <div>
            <button type="submit" className="btn btn-ink" disabled={!choixFait || etat.t === "envoi"}>
              {etat.t === "envoi" ? "Envoi…" : "Recevoir ma planche gratuite"}
            </button>
          </div>
        </Etape>
      </form>
    </div>
  );
}
