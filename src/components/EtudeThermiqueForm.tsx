"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import FileField, { appendFiles, filesReady, type PickedFile } from "./FileField";
import { thermique } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "sending" | "error";

const etapes: [string, string][] = [
  ["avant-depot", "Je prépare mon permis, il me faut l'attestation"],
  ["permis-accorde", "Mon permis est accordé, je consulte les artisans"],
  ["fin-travaux", "Les travaux se terminent, il me faut l'attestation d'achèvement"],
  ["pcmi-ici", "Mon permis a été fait par Permis by ID Maîtrise"],
];

/**
 * Formulaire de chiffrage des études thermiques RE2020. Le client coche les
 * prestations, dit où en est son projet et joint ses plans : c'est à partir
 * des surfaces et des orientations que le thermicien chiffre.
 */
export default function EtudeThermiqueForm() {
  const router = useRouter();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [choix, setChoix] = useState<Set<string>>(new Set(["attestation-depot"]));

  function toggle(id: string) {
    setChoix((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (choix.size === 0) {
      setStatus("error");
      setErrorMsg("Cochez au moins une prestation.");
      return;
    }
    if (!filesReady(files)) {
      setStatus("error");
      setErrorMsg("Patientez quelques secondes, l'envoi des fichiers est en cours.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    appendFiles(fd, files);
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/etude-thermique", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      trackEvent("etude_thermique_submit", { prestations: String(choix.size) });
      router.push("/devis/merci/etude-thermique");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-7">
      <h2 className="display text-4xl">Chiffrer mon étude RE2020</h2>

      {/* pot de miel anti-spam : caché aux humains */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website-th">Site web</label>
        <input id="website-th" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="field">
        <legend>Ce dont vous avez besoin</legend>
        <div className="mt-1 grid gap-2">
          {thermique.map((t) => (
            <label key={t.id} className="opt flex items-start gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink cursor-pointer">
              <input
                type="checkbox"
                name="prestations"
                value={t.id}
                checked={choix.has(t.id)}
                onChange={() => toggle(t.id)}
                className="mt-1 accent-ink h-4 w-4"
              />
              <span>
                <span className="font-bold">{t.name}</span>
                <span className="block text-sm text-ink-2">{t.when}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="th-etape">Où en est votre projet ?</label>
        <select id="th-etape" name="etape" required defaultValue="avant-depot">
          {etapes.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <FileField
        files={files}
        onChange={setFiles}
        label="Vos plans (facultatif)"
        hint="Plans du permis ou du constructeur, notice descriptive, devis de chauffage : PDF, DWG, JPG ou PNG, 25 Mo par fichier. Inutile si votre permis a été fait chez nous."
        max={8}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="th-name">Nom et prénom</label>
          <input id="th-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="th-email">E-mail</label>
          <input id="th-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="th-phone">Téléphone</label>
          <input id="th-phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="th-city">Commune du terrain</label>
          <input id="th-city" name="city" required placeholder="ex. Montivilliers 76290" />
          <span className="hint">Elle fixe la zone climatique et l&apos;altitude du calcul.</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="th-message">Précisions (facultatif)</label>
        <textarea
          id="th-message"
          name="message"
          placeholder="Surface de plancher, mode constructif, chauffage envisagé (pompe à chaleur, poêle…), date de dépôt prévue…"
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
        {status === "sending" ? "Envoi en cours…" : "Recevoir mon devis RE2020"}
      </button>
      <p className="text-xs text-ink-2">
        Devis sous 48 h ouvrées. Aucun engagement, aucune revente de vos données.
      </p>
    </form>
  );
}
