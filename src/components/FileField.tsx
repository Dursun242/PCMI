"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export interface PickedFile {
  name: string;
  size: number;
  file?: File; // envoyé en pièce jointe directe
  url?: string; // déjà stocké (Vercel Blob)
  status: "pending" | "uploading" | "stored" | "inline" | "error";
  error?: string;
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.zip,.doc,.docx,.dwg,.dxf";
const MAX = 25 * 1024 * 1024;
const INLINE_TOTAL = 3.5 * 1024 * 1024;

/**
 * Champ fichiers. Tente le stockage direct (Vercel Blob) ; si le serveur répond 501,
 * garde le fichier pour l'envoyer en pièce jointe directe (3,5 Mo au total).
 */
export default function FileField({
  files,
  onChange,
  label = "Pièces jointes",
  hint = "PDF, images, ZIP, DWG. 25 Mo par fichier.",
  max = 10,
}: {
  files: PickedFile[];
  onChange: (f: PickedFile[]) => void;
  label?: string;
  hint?: string;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const filesRef = useRef(files);
  filesRef.current = files;

  const set = (next: PickedFile[]) => {
    filesRef.current = next;
    onChange(next);
  };
  const patch = (name: string, p: Partial<PickedFile>) => set(filesRef.current.map((f) => (f.name === name ? { ...f, ...p } : f)));

  async function add(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).slice(0, max - filesRef.current.length);
    for (const file of incoming) {
      if (filesRef.current.some((f) => f.name === file.name)) continue;
      if (file.size > MAX) {
        set([...filesRef.current, { name: file.name, size: file.size, status: "error", error: "Dépasse 25 Mo" }]);
        continue;
      }
      set([...filesRef.current, { name: file.name, size: file.size, file, status: "uploading" }]);
      try {
        const blob = await upload(`envois/${Date.now()}-${file.name}`, file, { access: "public", handleUploadUrl: "/api/upload" });
        patch(file.name, { url: blob.url, file: undefined, status: "stored" });
      } catch {
        // stockage direct indisponible : pièce jointe directe si le total le permet
        const inlineTotal = filesRef.current.filter((f) => f.status === "inline").reduce((a, f) => a + f.size, 0) + file.size;
        if (inlineTotal <= INLINE_TOTAL) patch(file.name, { status: "inline" });
        else patch(file.name, { status: "error", error: "Trop lourd pour un envoi direct (3,5 Mo au total). Envoyez-le par e-mail après validation." });
      }
    }
    if (input.current) input.current.value = "";
  }

  const fmt = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`);

  return (
    <div className="field">
      <label htmlFor="files">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={`border border-dashed px-4 py-6 text-center text-sm ${drag ? "border-brass bg-paper" : "border-ink-3"}`}
      >
        <input ref={input} id="files" type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => add(e.target.files)} />
        <button type="button" onClick={() => input.current?.click()} className="font-bold underline decoration-brass underline-offset-4">
          Choisir des fichiers
        </button>{" "}
        <span className="text-ink-2">ou glissez-les ici</span>
        <div className="hint mt-1">{hint}</div>
      </div>
      {files.length > 0 && (
        <ul className="mt-2 grid gap-1.5 text-sm">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-3 border-b border-stone-2 py-1.5">
              <span className="truncate">
                {f.name} <span className="text-ink-3">({fmt(f.size)})</span>
                {f.status === "uploading" && <span className="ml-2 text-ink-2">envoi…</span>}
                {f.status === "error" && <span className="ml-2 text-alert">{f.error}</span>}
              </span>
              <button type="button" aria-label={`Retirer ${f.name}`} onClick={() => set(filesRef.current.filter((x) => x.name !== f.name))} className="shrink-0 text-ink-2 hover:text-alert">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ajoute les fichiers au FormData : stockés → JSON "uploaded", directs → champ "files". */
export function appendFiles(fd: FormData, files: PickedFile[]) {
  fd.append("uploaded", JSON.stringify(files.filter((f) => f.status === "stored").map((f) => ({ name: f.name, url: f.url, size: f.size }))));
  for (const f of files) if (f.status === "inline" && f.file) fd.append("files", f.file, f.name);
}

export const filesReady = (files: PickedFile[]) => !files.some((f) => f.status === "uploading");
