"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { plans, type PlanId } from "@/config/site";

type Status = "idle" | "sending" | "sent" | "error";

const projectTypes = [
  ["maison-neuve", "Maison neuve"],
  ["extension", "Extension ou surélévation"],
  ["garage-annexe", "Garage, annexe, abri"],
  ["autre", "Autre projet"],
];

const stages = [
  ["idee", "J'ai une idée, pas encore de plans"],
  ["terrain", "J'ai un terrain et un croquis"],
  ["plans", "J'ai des plans (constructeur, Kasaplan, dessinateur)"],
  ["refus", "Mon permis a été refusé ou incomplet"],
];

export default function DevisForm() {
  const params = useSearchParams();
  const preset = params.get("formule");
  const initialPlan: PlanId | "conseil" = plans.some((p) => p.id === preset) ? (preset as PlanId) : "conseil";

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  if (status === "sent") {
    return (
      <div className="grid gap-4 py-6" role="status">
        <span className="stamp text-2xl w-fit">Reçu</span>
        <h2 className="display text-4xl">Votre demande est bien arrivée.</h2>
        <p className="text-ink-2 leading-relaxed">
          Vous recevez un e-mail de confirmation dans quelques instants, puis votre devis chiffré sous 48 h ouvrées. Pensez à vérifier vos courriers indésirables.
        </p>
        <Link href="/permis-de-construire-maison" className="btn btn-line w-fit">
          Lire le guide du permis en attendant
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-7" noValidate={false}>
      <h2 className="display text-4xl">Décrivez votre projet</h2>

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
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="phone">Téléphone</label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" />
          <span className="hint">Pour un premier échange rapide.</span>
        </div>
        <div className="field">
          <label htmlFor="city">Commune et code postal du terrain</label>
          <input id="city" name="city" required placeholder="ex. Montivilliers 76290" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="projectType">Type de projet</label>
          <select id="projectType" name="projectType" required defaultValue="maison-neuve">
            {projectTypes.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="surface">Surface de plancher approximative (m²)</label>
          <input id="surface" name="surface" type="number" inputMode="numeric" min={5} max={600} placeholder="ex. 120" />
          <span className="hint">Formules à prix fixe jusqu&apos;à 149 m². Au-delà, devis sur mesure (architecte légalement obligatoire au-delà de 150 m²).</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="stage">Où en êtes-vous ?</label>
        <select id="stage" name="stage" required defaultValue="terrain">
          {stages.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <fieldset className="field">
        <legend>Formule envisagée</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {[...plans.map((p) => [p.id, p.name] as const), ["conseil", "Conseillez-moi"] as const].map(([v, l]) => (
            <label key={v} className="opt flex items-center gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink cursor-pointer">
              <input type="radio" name="plan" value={v} defaultChecked={initialPlan === v} className="accent-ink h-4 w-4" />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="message">Votre projet en quelques lignes</label>
        <textarea
          id="message"
          name="message"
          placeholder="Plain-pied ou étage, nombre de chambres, style, contraintes connues (pente, voisinage, zone protégée), délai souhaité…"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" required className="mt-1 accent-ink h-4 w-4" />
        <span>
          J&apos;accepte que mes informations soient utilisées pour répondre à ma demande de devis.{" "}
          <Link href="/confidentialite" className="underline decoration-brass underline-offset-2">Politique de confidentialité</Link>.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="acceptCgv" required className="mt-1 accent-ink h-4 w-4" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/cgv" className="underline decoration-brass underline-offset-2">conditions générales de vente</Link>.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="executionAnticipee" className="mt-1 accent-ink h-4 w-4" />
        <span>
          Je demande le démarrage de la prestation avant la fin du délai de rétractation de 14 jours, et je reconnais perdre mon droit de rétractation une fois la prestation intégralement exécutée (voir <Link href="/cgv" className="underline decoration-brass underline-offset-2">CGV</Link>, article 8).
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">
          {errorMsg} Vous pouvez aussi nous écrire directement par e-mail.
        </p>
      )}

      <button type="submit" className="btn btn-ink" disabled={status === "sending"}>
        {status === "sending" ? "Envoi en cours…" : "Recevoir mon devis sous 48 h"}
      </button>
      <p className="text-xs text-ink-2">Aucun engagement. Aucune revente de vos données.</p>
    </form>
  );
}
