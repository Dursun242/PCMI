"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { express } from "@/config/site";
import { surfaceBucket, trackEvent } from "@/lib/analytics";
import { noterEnvoi, suivreExpress } from "@/lib/suiviClient";

type Status = "idle" | "sending" | "error";

/**
 * Formulaire de la page /permis-express, réduit au strict nécessaire : quatre
 * cases (nom, téléphone, e-mail, commune du terrain). Tout le reste se dit au rappel.
 * Cases encadrées, libellé en clair et exemple dedans : on voit où écrire.
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
      // Surface et échéance ne sont plus demandées : elles se précisent au rappel.
      trackEvent("express_submit", { eligible: "a-verifier", urgent: "false", surface_bucket: surfaceBucket(null) });
      noterEnvoi();
      router.push("/devis/merci/express");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} onChange={markStarted} className="grid gap-5">
      {/* pot de miel anti-spam : caché aux humains */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Case id="name" libelle="Votre prénom et nom" exemple="ex. Marie Dupont" autoComplete="name" />
      <Case id="phone" libelle="Votre téléphone" exemple="ex. 06 12 34 56 78" type="tel" autoComplete="tel" inputMode="tel" />
      <Case id="email" libelle="Votre e-mail" exemple="ex. marie.dupont@gmail.com" type="email" autoComplete="email" inputMode="email" />
      <Case id="city" libelle="Commune du terrain" exemple="ex. Montivilliers" autoComplete="address-level2" />

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
        {status === "sending" ? "Envoi en cours…" : "Recevoir mon devis gratuit"}
      </button>
      <ul className="grid gap-1.5 text-sm">
        {[`Rappel ${express.rappel.delai}, ${express.rappel.horaires}`, "Prix fixe annoncé avant tout engagement", "Gratuit, sans engagement, aucune revente de vos données"].map((t) => (
          <li key={t} className="flex gap-2">
            <span aria-hidden="true" className="text-bronze">✓</span>
            {t}
          </li>
        ))}
      </ul>
    </form>
  );
}

/** Case de saisie bien visible : libellé en clair au-dessus, cadre, exemple dedans. */
function Case({
  id,
  libelle,
  exemple,
  type = "text",
  autoComplete,
  inputMode,
}: {
  id: string;
  libelle: string;
  exemple: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email";
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-bold">
        {libelle}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={exemple}
        className="min-h-13 w-full rounded-md border-2 border-stone-2 bg-stone px-4 text-lg text-ink placeholder:text-ink-3 focus:border-bronze focus:bg-paper focus:outline-none"
      />
    </div>
  );
}
