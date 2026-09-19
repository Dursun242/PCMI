"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import FileField, { appendFiles, filesReady, type PickedFile } from "./FileField";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "sending" | "error";

const besoins: [string, string][] = [
  ["chiffrer", "Chiffrer mon dossier de permis complet"],
  ["conformite", "Vérifier sa conformité au PLU"],
  ["reprendre", "Reprendre ou corriger ce plan"],
  ["autre", "Autre chose"],
];

/**
 * Formulaire court : le client envoie son plan de masse existant, nous le
 * chiffrons. Volontairement limité à ce qui permet de rappeler la personne et
 * de lire le bon règlement d'urbanisme — le reste est dans le fichier.
 */
export default function PlanDeMasseForm() {
  const router = useRouter();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const utilisables = files.filter((f) => f.status === "stored" || f.status === "inline");
  const pretAEnvoyer = filesReady(files) && utilisables.length > 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pretAEnvoyer) {
      setStatus("error");
      setErrorMsg(
        utilisables.length === 0
          ? "Joignez votre plan de masse : c'est lui que nous analysons."
          : "Patientez quelques secondes, l'envoi des fichiers est en cours.",
      );
      return;
    }

    const fd = new FormData(e.currentTarget);
    appendFiles(fd, files);
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/plan-de-masse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      trackEvent("plan_de_masse_submit", { fichiers: String(utilisables.length) });
      // Chemin dédié : les envois de plan se comptent séparément des devis.
      router.push("/devis/merci/plan-de-masse");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-7">
      <h2 className="display text-4xl">Envoyez votre plan</h2>

      {/* pot de miel anti-spam : caché aux humains */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website-pdm">Site web</label>
        <input id="website-pdm" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <FileField
        files={files}
        onChange={setFiles}
        label="Votre plan de masse"
        hint="PDF, DWG, DXF, JPG ou PNG. 25 Mo par fichier. Ajoutez aussi le plan du géomètre ou l'extrait cadastral si vous les avez."
        max={5}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="pdm-name">Nom et prénom</label>
          <input id="pdm-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="pdm-email">E-mail</label>
          <input id="pdm-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="pdm-phone">Téléphone</label>
          <input id="pdm-phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="pdm-city">Commune et code postal du terrain</label>
          <input id="pdm-city" name="city" required placeholder="ex. Montivilliers 76290" />
          <span className="hint">C&apos;est elle qui détermine le règlement que nous consultons.</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pdm-besoin">Ce que vous attendez de nous</label>
        <select id="pdm-besoin" name="besoin" required defaultValue="chiffrer">
          {besoins.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="pdm-message">Précisions (facultatif)</label>
        <textarea
          id="pdm-message"
          name="message"
          placeholder="Qui a fait ce plan, à quelle date, ce qui a changé depuis, les contraintes que vous connaissez…"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" value="oui" required className="mt-1 accent-ink h-4 w-4" />
        <span>
          J&apos;accepte que mes informations et mes fichiers soient utilisés pour répondre à ma demande.{" "}
          <Link href="/confidentialite" className="underline decoration-brass underline-offset-2">Politique de confidentialité</Link>.
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">
          {errorMsg}
        </p>
      )}

      <button type="submit" className="btn btn-ink" disabled={status === "sending"}>
        {status === "sending" ? "Envoi en cours…" : "Envoyer mon plan de masse"}
      </button>
      <p className="text-xs text-ink-2">
        Réponse sous 48 h ouvrées. Aucun engagement, aucune revente de vos données, et vos fichiers ne servent qu&apos;à
        votre projet.
      </p>
    </form>
  );
}
