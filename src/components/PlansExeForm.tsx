"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import FileField, { appendFiles, filesReady, type PickedFile } from "./FileField";
import { exePacks, exePlans } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "sending" | "error";

const etats: [string, string][] = [
  ["accorde", "Mon permis est accordé"],
  ["depose", "Mon permis est déposé, en cours d'instruction"],
  ["pcmi-ici", "Mon permis a été fait par Permis by ID Maîtrise"],
  ["pas-encore", "Je n'ai pas encore de permis"],
];

/**
 * Formulaire de chiffrage des plans d'exécution.
 *
 * Le client coche les lots dont il a besoin (ou un pack), dit où en est son
 * permis et joint ses plans PCMI : c'est à partir d'eux que nous chiffrons.
 * Les plans sont facultatifs, contrairement au plan de masse : un client qui
 * a fait son permis chez nous n'a rien à renvoyer.
 */
export default function PlansExeForm({ preselect }: { preselect?: string[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pack, setPack] = useState<string>(
    preselect?.length === 1 && exePacks.some((p) => p.id === preselect[0]) ? preselect[0] : "",
  );
  const [lots, setLots] = useState<Set<string>>(
    new Set((preselect ?? []).filter((id) => exePlans.some((p) => p.id === id))),
  );

  const packChoisi = exePacks.find((p) => p.id === pack);
  // Les lots d'un pack sont affichés cochés et verrouillés.
  const lotsEffectifs = new Set<string>([...(packChoisi?.includes ?? []), ...lots]);

  function toggleLot(id: string) {
    setLots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lotsEffectifs.size === 0) {
      setStatus("error");
      setErrorMsg("Cochez au moins un plan, ou choisissez un pack.");
      return;
    }
    if (!filesReady(files)) {
      setStatus("error");
      setErrorMsg("Patientez quelques secondes, l'envoi des fichiers est en cours.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.delete("lots");
    lotsEffectifs.forEach((id) => fd.append("lots", id));
    appendFiles(fd, files);
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/plans-execution", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      trackEvent("plans_exe_submit", { pack: pack || "a-la-carte", lots: String(lotsEffectifs.size) });
      router.push("/devis/merci/plans-execution");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-7">
      <h2 className="display text-4xl">Chiffrer mes plans d&apos;exécution</h2>

      {/* pot de miel anti-spam : caché aux humains */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website-exe">Site web</label>
        <input id="website-exe" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="field">
        <legend>Un pack, ou à la carte</legend>
        <div className="mt-1 grid gap-2">
        {[{ id: "", name: "À la carte", promise: "Je choisis les plans ci-dessous, un par un." }, ...exePacks].map((p) => (
          <label
            key={p.id}
            className="opt flex cursor-pointer items-start gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink"
          >
            <input
              type="radio"
              name="pack"
              value={p.id}
              checked={pack === p.id}
              onChange={() => setPack(p.id)}
              className="mt-1 accent-ink h-4 w-4"
            />
            <span>
              <span className="font-bold">{p.name}</span>
              <span className="block text-sm text-ink-2">{p.promise}</span>
            </span>
          </label>
        ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Les plans dont vous avez besoin</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {exePlans.map((p) => {
            const locked = packChoisi?.includes.includes(p.id) ?? false;
            return (
              <label key={p.id} className={`opt flex items-start gap-3 text-[0.95rem] ${locked ? "text-ink-2" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  name="lots"
                  value={p.id}
                  checked={lotsEffectifs.has(p.id)}
                  disabled={locked}
                  onChange={() => toggleLot(p.id)}
                  className="mt-1 accent-ink h-4 w-4"
                />
                <span>{p.name}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="exe-etat">Où en est votre permis ?</label>
        <select id="exe-etat" name="etat" required defaultValue="accorde">
          {etats.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <FileField
        files={files}
        onChange={setFiles}
        label="Vos plans de permis (facultatif)"
        hint="Plans PCMI, plans du constructeur, rapport de sol, attestation RE2020 : PDF, DWG, DXF, JPG ou PNG, 25 Mo par fichier. Inutile si votre permis a été fait chez nous."
        max={8}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="exe-name">Nom et prénom</label>
          <input id="exe-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="exe-email">E-mail</label>
          <input id="exe-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="exe-phone">Téléphone</label>
          <input id="exe-phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="exe-city">Commune du chantier</label>
          <input id="exe-city" name="city" required placeholder="ex. Montivilliers 76290" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="exe-message">Précisions (facultatif)</label>
        <textarea
          id="exe-message"
          name="message"
          placeholder="Mode constructif (parpaing, brique, ossature bois), type de toiture, date de démarrage du chantier, artisans déjà consultés…"
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
        {status === "sending" ? "Envoi en cours…" : "Recevoir mon devis EXE"}
      </button>
      <p className="text-xs text-ink-2">
        Devis sous 4 h ouvrées, après lecture de votre dossier de permis. Aucun engagement, aucune revente de vos
        données.
      </p>
    </form>
  );
}
