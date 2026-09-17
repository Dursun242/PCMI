"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { steps, type Field } from "@/config/dossier";
import FileField, { appendFiles, filesReady, type PickedFile } from "./FileField";

type Values = Record<string, string>;
type Status = "idle" | "sending" | "sent" | "error";
const STORAGE = "permis-dossier-draft";

function visible(f: Field, v: Values) {
  if (!f.showIf) return true;
  const cur = v[f.showIf.id] ?? "";
  return Array.isArray(f.showIf.equals) ? f.showIf.equals.includes(cur) : cur === f.showIf.equals;
}

export default function DossierForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  // brouillon local : on ne perd rien en changeant d'onglet
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setValues(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (Object.keys(values).length) localStorage.setItem(STORAGE, JSON.stringify(values));
    } catch {}
  }, [values]);

  const current = steps[step];
  const set = (id: string, val: string) => setValues((v) => ({ ...v, [id]: val }));

  const missing = useMemo(
    () => current.fields.filter((f) => f.required && visible(f, values) && !(values[f.id] ?? "").trim()).map((f) => f.id),
    [current, values],
  );
  const total = Number(values.sp_existante || 0) + Number(values.sp_creee || 0) - Number(values.sp_demolie || 0);
  const overThreshold = values.sp_creee !== undefined && total > 149;

  function next() {
    setTouched(true);
    if (missing.length) return;
    setTouched(false);
    setStep((s) => Math.min(steps.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (missing.length || !filesReady(files)) return;
    if (!values.consent) {
      setError("Merci d'accepter le traitement de votre demande.");
      setStatus("error");
      return;
    }
    const fd = new FormData();
    fd.append("data", JSON.stringify(values));
    appendFiles(fd, files);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/dossier", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      setStatus("sent");
      try {
        localStorage.removeItem(STORAGE);
      } catch {}
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  if (status === "sent") {
    return (
      <div className="grid gap-4 py-6" role="status">
        <span className="stamp text-2xl w-fit">Reçu</span>
        <h2 className="display text-4xl">Votre fiche projet est bien arrivée.</h2>
        <p className="text-ink-2 leading-relaxed">
          {overThreshold
            ? "Votre projet dépasse 149 m² de surface de plancher : nous préparons un devis sur mesure avec notre architecte partenaire et revenons vers vous sous 48 h ouvrées."
            : "Nous lisons le règlement d'urbanisme de votre commune et vous adressons sous 48 h ouvrées un devis à prix fixe, avec la formule conseillée et les prochaines étapes."}
        </p>
        <Link href="/conseils" className="btn btn-line w-fit">Lire nos conseils en attendant</Link>
      </div>
    );
  }

  const input = (f: Field) => {
    const v = values[f.id] ?? "";
    const invalid = touched && f.required && !v.trim();
    const cls = invalid ? "!border-alert" : "";
    switch (f.type) {
      case "textarea":
        return <textarea id={f.id} value={v} onChange={(e) => set(f.id, e.target.value)} placeholder={f.placeholder} className={cls} />;
      case "select":
        return (
          <select id={f.id} value={v} onChange={(e) => set(f.id, e.target.value)} className={cls}>
            <option value="">—</option>
            {f.options!.map(([val, l]) => (
              <option key={val} value={val}>{l}</option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className={`mt-1 grid gap-2 ${f.options!.length > 2 ? "sm:grid-cols-2" : "grid-cols-2"} ${invalid ? "outline outline-1 outline-alert p-1" : ""}`}>
            {f.options!.map(([val, l]) => (
              <label key={val} className="opt flex items-center gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink cursor-pointer">
                <input type="radio" name={f.id} value={val} checked={v === val} onChange={() => set(f.id, val)} className="accent-ink h-4 w-4" />
                <span>{l}</span>
              </label>
            ))}
          </div>
        );
      default:
        return (
          <div className="relative">
            <input id={f.id} type={f.type} value={v} onChange={(e) => set(f.id, e.target.value)} placeholder={f.placeholder} inputMode={f.type === "number" ? "decimal" : undefined} className={cls} />
            {f.unit && <span className="absolute right-0 bottom-3 text-sm text-ink-3">{f.unit}</span>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-7" noValidate>
      {/* progression */}
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] font-bold uppercase tracking-[0.14em]">
        {steps.map((s, i) => (
          <li key={s.id} className={i === step ? "text-ink" : i < step ? "text-brass" : "text-ink-3"}>
            {String(i + 1).padStart(2, "0")} {s.title}
          </li>
        ))}
      </ol>

      <div>
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brass">CERFA 13406 · {current.cerfa}</p>
        <h2 className="display text-4xl mt-2">{current.title}</h2>
        {current.intro && <p className="mt-3 text-ink-2 text-[0.95rem] leading-relaxed">{current.intro}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {current.fields.filter((f) => visible(f, values)).map((f) => (
          <div key={f.id} className={`field ${f.half ? "" : "sm:col-span-2"}`}>
            {f.type !== "radio" ? <label htmlFor={f.id}>{f.label}{f.required && " *"}</label> : <span className="text-[0.8rem] font-bold uppercase tracking-[0.06em] text-ink-2">{f.label}{f.required && " *"}</span>}
            {input(f)}
            {f.hint && <span className="hint">{f.hint}</span>}
          </div>
        ))}
      </div>

      {current.id === "surfaces" && overThreshold && (
        <p className="border-l-2 border-brass pl-4 text-sm text-ink-2">
          Surface de plancher totale estimée : <strong className="text-ink">{total} m²</strong>. Au-delà de 149 m², le recours à un architecte est obligatoire : votre permis sera établi sur devis, avec notre architecte partenaire. Vous pouvez continuer la fiche.
        </p>
      )}

      {current.id === "mission" && (
        <>
          <FileField files={files} onChange={setFiles} label="Documents du projet" hint="Plans, croquis, photos du terrain, bornage, CU, acte ou compromis. PDF, images, ZIP, DWG. 25 Mo par fichier." max={15} />
          <label className="flex items-start gap-3 text-sm text-ink-2">
            <input type="checkbox" checked={values.consent === "oui"} onChange={(e) => set("consent", e.target.checked ? "oui" : "")} className="mt-1 accent-ink h-4 w-4" />
            <span>
              J&apos;accepte que ces informations et documents soient utilisés pour établir mon devis et, le cas échéant, mon dossier de permis.{" "}
              <Link href="/confidentialite" className="underline decoration-brass underline-offset-2">Politique de confidentialité</Link>.
            </span>
          </label>
        </>
      )}

      {touched && missing.length > 0 && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">Merci de compléter les champs marqués d&apos;un astérisque.</p>}
      {status === "error" && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-2 pt-6">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn btn-line disabled:opacity-40">
          Précédent
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={next} className="btn btn-ink">Continuer</button>
        ) : (
          <button type="submit" className="btn btn-ink" disabled={status === "sending" || !filesReady(files)}>
            {status === "sending" ? "Envoi en cours…" : "Envoyer ma fiche projet"}
          </button>
        )}
      </div>
      <p className="text-xs text-ink-2">Votre saisie est conservée sur cet appareil jusqu&apos;à l&apos;envoi. Étape {step + 1} sur {steps.length}.</p>
    </form>
  );
}
