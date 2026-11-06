"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import type { PhotosDp as Photos } from "@/lib/dpPiscine";

interface Props {
  photos: Photos;
  onChange: (p: Photos) => void;
}

const COINS = ["le coin proche à gauche", "le coin proche à droite", "le coin loin à droite", "le coin loin à gauche"];

/**
 * Photos exigées quand la piscine se voit de la rue : DP7 (environnement proche), DP8 (paysage lointain), et DP6
 * (insertion) : sur la photo proche, le client touche les 4 coins du futur bassin, l'outil y pose la piscine.
 */
export default function PhotosDp({ photos, onChange }: Props) {
  const [envoi, setEnvoi] = useState<"proche" | "lointaine" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [apercu, setApercu] = useState<Record<string, string>>({});

  async function choisir(cle: "proche" | "lointaine", f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      setErreur("Photo au format JPEG, PNG ou WebP.");
      return;
    }
    setErreur(null);
    setEnvoi(cle);
    const local = URL.createObjectURL(f);
    try {
      const b = await upload(`dp-piscine-photos/${Date.now()}-${cle}.${f.type.split("/")[1]}`, f, { access: "public", handleUploadUrl: "/api/upload" });
      setApercu((a) => ({ ...a, [cle]: local }));
      onChange({ ...photos, [cle]: b.url, ...(cle === "proche" ? { coins: [], repere: undefined } : {}) });
    } catch {
      setErreur("La photo n'a pas pu être envoyée. Réessayez (25 Mo au plus).");
    }
    setEnvoi(null);
  }

  function toucher(e: React.MouseEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if ((photos.coins ?? []).length >= 4) return;
    const r = img.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) * img.naturalWidth) / r.width);
    const y = Math.round(((e.clientY - r.top) * img.naturalHeight) / r.height);
    onChange({ ...photos, coins: [...(photos.coins ?? []), [x, y]], repere: [img.naturalWidth, img.naturalHeight] });
  }

  const coins = photos.coins ?? [];
  const srcProche = apercu.proche ?? photos.proche;

  return (
    <div className="grid gap-6 border-t border-stone-2 pt-6">
      <p className="max-w-[64ch] text-[0.95rem] leading-relaxed">
        La piscine se verra depuis la rue : la mairie demande deux photos et un photomontage. Prenez-les depuis la rue,
        face au terrain.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {(["proche", "lointaine"] as const).map((cle) => (
          <div key={cle} className="field">
            <label htmlFor={`dp-photo-${cle}`}>{cle === "proche" ? "Photo de près (le terrain et la future piscine)" : "Photo de loin (le terrain dans le paysage)"}</label>
            <input id={`dp-photo-${cle}`} type="file" accept="image/jpeg,image/png,image/webp" className="min-h-12 text-sm" onChange={(e) => void choisir(cle, e.target.files?.[0])} />
            <p className="hint">{envoi === cle ? "Envoi…" : photos[cle] ? "Photo reçue." : cle === "proche" ? "Pièce DP7." : "Pièce DP8."}</p>
          </div>
        ))}
      </div>
      {erreur && <p role="alert" className="text-sm text-alert">{erreur}</p>}
      {srcProche && (
        <div className="grid gap-3">
          <p className="text-[0.95rem]">
            <strong>Photomontage (DP6) :</strong>{" "}
            {coins.length < 4 ? `touchez sur la photo ${COINS[coins.length]} du futur bassin (${coins.length + 1}/4).` : "les 4 coins sont posés."}
          </p>
          <div className="relative max-w-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={srcProche} alt="Votre photo de près : touchez les coins du futur bassin" className="block h-auto w-full cursor-crosshair border border-ink" onClick={toucher} />
            {photos.repere && coins.length > 0 && (
              <svg viewBox={`0 0 ${photos.repere[0]} ${photos.repere[1]}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                <polygon points={coins.map(([x, y]) => `${x},${y}`).join(" ")} fill="rgba(43,143,209,0.45)" stroke="#fff" strokeWidth={photos.repere[0] / 300} />
                {coins.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={photos.repere![0] / 120} fill="#1b1f1d" stroke="#fff" strokeWidth={photos.repere![0] / 400} />)}
              </svg>
            )}
          </div>
          {coins.length > 0 && (
            <div><button type="button" className="btn btn-line" onClick={() => onChange({ ...photos, coins: [] })}>Recommencer les coins</button></div>
          )}
        </div>
      )}
    </div>
  );
}
