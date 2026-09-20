"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import FileField, { appendFiles, filesReady, type PickedFile } from "./FileField";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!filesReady(files)) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete("files");
    appendFiles(fd, files);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      setStatus("sent");
      form.reset();
      setFiles([]);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  if (status === "sent") {
    return (
      <div className="grid gap-4 py-6" role="status">
        <span className="stamp text-2xl w-fit">Reçu</span>
        <h2 className="display text-4xl">Message bien reçu.</h2>
        <p className="text-ink-2 leading-relaxed">Nous vous répondons sous 4 h ouvrées. Un accusé de réception vient de vous être envoyé.</p>
        <Link href="/conseils" className="btn btn-line w-fit">Lire nos conseils en attendant</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-7">
      <h2 className="display text-4xl">Écrivez-nous</h2>
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
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="city">Commune du projet</label>
          <input id="city" name="city" placeholder="ex. Montivilliers 76290" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="subject">Objet</label>
        <select id="subject" name="subject" defaultValue="question">
          <option value="question">Une question sur un permis</option>
          <option value="devis">Une demande de devis</option>
          <option value="refus">Un permis refusé ou incomplet</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="message">Votre message</label>
        <textarea id="message" name="message" required placeholder="Décrivez votre projet ou votre question en quelques lignes." />
      </div>

      <FileField files={files} onChange={setFiles} hint="Plans, croquis, photos du terrain, arrêté de refus… PDF, images, ZIP, DWG. 25 Mo par fichier." />

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" required className="mt-1 accent-ink h-4 w-4" />
        <span>
          J&apos;accepte que mes informations soient utilisées pour répondre à ma demande.{" "}
          <Link href="/confidentialite" className="underline decoration-brass underline-offset-2">Politique de confidentialité</Link>.
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{error} Vous pouvez aussi nous écrire directement par e-mail.</p>
      )}

      <button type="submit" className="btn btn-ink" disabled={status === "sending" || !filesReady(files)}>
        {status === "sending" ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}
