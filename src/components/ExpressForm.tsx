"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { express } from "@/config/site";
import { surfaceBucket, trackEvent } from "@/lib/analytics";
import { suivreExpress } from "@/lib/suiviClient";
import { ECHEANCES, RENDEZ_VOUS, SITUATIONS_TERRAIN, TYPES_MAISON, eligibleExpress, estUrgente, type Choix } from "@/lib/express";

type Status = "idle" | "sending" | "error";

/** Groupe de boutons radio présentés en pastilles, plus rapides à toucher qu'une liste déroulante. */
function Pastilles({ name, legend, choix, defaut }: { name: string; legend: string; choix: Choix; defaut?: string }) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        {choix.map(([v, l]) => (
          <label
            key={v}
            className="opt flex min-h-12 items-center gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink cursor-pointer"
          >
            <input type="radio" name={name} value={v} defaultChecked={v === defaut} className="accent-ink h-4 w-4 shrink-0" />
            <span className="leading-snug">{l}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Formulaire court de la page /permis-express : trois champs obligatoires
 * (nom, téléphone, commune), le reste se coche en un geste. Les réponses
 * servent à trier les demandes (éligibilité Express, urgence) dans l'e-mail.
 */
export default function ExpressForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const gclid = useRef("");
  const started = useRef(false);

  // Identifiant du clic Google Ads, transmis dans l'e-mail pour l'import des conversions.
  useEffect(() => {
    gclid.current = new URLSearchParams(window.location.search).get("gclid") ?? "";
  }, []);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackEvent("devis_start", { formule: "express" });
    suivreExpress("formulaire");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data: Record<string, string> = { gclid: gclid.current };
    new FormData(e.currentTarget).forEach((v, k) => {
      if (typeof v === "string") data[k] = v;
    });
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      const surface = Number(data.surface) || null;
      trackEvent("express_submit", {
        eligible: String(eligibleExpress({ typeMaison: data.typeMaison ?? "", surface })),
        urgent: String(estUrgente({ echeance: data.echeance ?? "", terrain: data.terrain ?? "" })),
        surface_bucket: surfaceBucket(surface),
      });
      router.push("/devis/merci/express");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} onChange={markStarted} className="grid gap-6">
      {/* pot de miel anti-spam : caché aux humains */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="name">Nom et prénom</label>
          <input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="phone">Téléphone</label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
          <span className="hint">Nous vous rappelons sous 4 h ouvrées.</span>
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="city">Commune et code postal du terrain</label>
          <input id="city" name="city" required placeholder="ex. Montivilliers 76290" />
        </div>
      </div>

      <Pastilles name="typeMaison" legend="Votre maison" choix={TYPES_MAISON} defaut="plain-pied" />

      <div className="field">
        <label htmlFor="surface">Surface approximative (m²)</label>
        <input id="surface" name="surface" type="number" inputMode="numeric" min={20} max={600} placeholder="ex. 100" />
        <span className="hint">Formule Express jusqu&apos;à {express.surfaceMax} m². Au-delà, nous vous proposons la formule adaptée.</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="terrain">Votre terrain</label>
          <select id="terrain" name="terrain" defaultValue="compromis">
            {SITUATIONS_TERRAIN.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="echeance">Dépôt du permis souhaité</label>
          <select id="echeance" name="echeance" defaultValue="1-mois">
            {ECHEANCES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <Pastilles name="rendezVous" legend="Vous préférez" choix={RENDEZ_VOUS} defaut="distance" />

      <div className="field">
        <label htmlFor="email">E-mail (facultatif)</label>
        <input id="email" name="email" type="email" autoComplete="email" />
        <span className="hint">Pour recevoir le devis écrit et nous envoyer vos documents.</span>
      </div>

      <div className="field">
        <label htmlFor="message">Un mot sur le projet (facultatif)</label>
        <textarea id="message" name="message" rows={3} placeholder="Nombre de chambres, garage accolé, date limite du compromis…" />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" required className="mt-1 accent-ink h-4 w-4" />
        <span>
          J&apos;accepte que mes informations servent à répondre à ma demande.{" "}
          <Link href="/confidentialite" className="underline decoration-brass underline-offset-2">Politique de confidentialité</Link>.
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">
          {errorMsg} Vous pouvez aussi nous appeler directement.
        </p>
      )}

      <button type="submit" className="btn btn-ink" disabled={status === "sending"}>
        {status === "sending" ? "Envoi en cours…" : "Être rappelé avec mon devis"}
      </button>
      <p className="text-xs text-ink-2">Gratuit et sans engagement. Aucune revente de vos données.</p>
    </form>
  );
}
