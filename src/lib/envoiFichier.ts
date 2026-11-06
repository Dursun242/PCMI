import { upload } from "@vercel/blob/client";

/**
 * Envoie un fichier du navigateur et renvoie son adresse : Cloudflare R2 par une adresse signée (/api/envoi) ; si
 * R2 n'est pas configuré (501), l'ancien envoi vers Vercel Blob (/api/upload).
 */
export async function envoyerFichier(dossier: "envois" | "dp-piscine-photos", nom: string, f: File): Promise<string> {
  const r = await fetch("/api/envoi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dossier, nom, type: f.type, taille: f.size }),
  });
  if (r.status === 501) {
    const b = await upload(`${dossier}/${Date.now()}-${nom}`, f, { access: "public", handleUploadUrl: "/api/upload" });
    return b.url;
  }
  const json = (await r.json().catch(() => ({}))) as { envoi?: string; url?: string; error?: string };
  if (!r.ok || !json.envoi || !json.url) throw new Error(json.error ?? `Envoi refusé (${r.status})`);
  const put = await fetch(json.envoi, { method: "PUT", body: f, headers: { "Content-Type": f.type } });
  if (!put.ok) throw new Error(`Envoi du fichier impossible (${put.status})`);
  return json.url;
}
