"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/articles";

/* Limite côté serveur (4 Mo) et limite de corps de requête Vercel (4,5 Mo) :
   on ne tente l'envoi tel quel qu'en dessous de cette taille. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const MAX_EDGE = 1800; // px : largement suffisant pour une vignette 1200×630

/**
 * Redimensionne et compresse une photo dans le navigateur (JPEG q=0,85, côté
 * max 1800 px) pour que les photos de téléphone (souvent 3 à 8 Mo, parfois en
 * HEIC) passent sous la limite d'envoi. Les SVG et les petits fichiers sont
 * renvoyés tels quels.
 */
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "Le navigateur ne sait pas lire cette image (format HEIC ?). Exportez-la en JPEG ou PNG puis réessayez.",
    );
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const needsResize = scale < 1;
  const needsCompress = file.size > MAX_UPLOAD_BYTES;
  if (!needsResize && !needsCompress) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de préparer l'image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Impossible de préparer l'image.");
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image trop lourde même après compression. Réduisez-la avant de l'envoyer.");
  }
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export default function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const isEdit = Boolean(article);

  const [slug, setSlug] = useState(article?.slug ?? "");
  const [title, setTitle] = useState(article?.title ?? "");
  const [description, setDescription] = useState(article?.description ?? "");
  const [date, setDate] = useState(article?.date ?? "");
  const [keywords, setKeywords] = useState(article?.keywords.join(", ") ?? "");
  const [image, setImage] = useState(article?.image ?? "");
  const [imageAlt, setImageAlt] = useState(article?.imageAlt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("saved") === "1") setSaved(true);
  }, []);

  async function onUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const prepared = await prepareImage(file);
      const form = new FormData();
      form.append("file", prepared);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      let data: { ok?: boolean; path?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Réponse non JSON : typiquement une erreur de la plateforme (413, 502…)
      }
      if (!res.ok || !data.ok || !data.path) {
        setError(data.error ?? `Envoi de l'image impossible (erreur ${res.status}).`);
        return;
      }
      setImage(data.path);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Envoi de l'image impossible.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(isEdit ? `/api/admin/articles/${article!.slug}` : "/api/admin/articles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, description, date, keywords, image, imageAlt, content }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      if (isEdit) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/articles/${data.slug}?saved=1`);
        router.refresh();
      }
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!article) return;
    if (!confirm(`Supprimer définitivement « ${article.title} » ?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/articles/${article.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Suppression impossible.");
        return;
      }
      router.push("/admin/articles");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!isEdit && (
        <div className="field">
          <label htmlFor="slug">Slug (optionnel, déduit du titre sinon)</label>
          <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="mon-article" />
        </div>
      )}
      <div className="field">
        <label htmlFor="title">Titre</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="description">Description (méta, résumé)</label>
        <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="date">Date (AAAA-MM-JJ)</label>
          <input id="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-01-01" />
        </div>
        <div className="field">
          <label htmlFor="keywords">Mots-clés (séparés par des virgules)</label>
          <input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="image">Image (chemin dans /public, optionnel)</label>
          <input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="/photos/xxx.jpg" />
          <div className="mt-2 flex items-center gap-3">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-14 w-14 border border-ink/10 object-cover" />
            )}
            <label className="hint cursor-pointer underline">
              {uploading ? "Envoi…" : "Choisir un fichier (jpg, png, webp, svg — les photos sont réduites automatiquement)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/heic,image/heif"
                onChange={onUploadImage}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="field">
          <label htmlFor="imageAlt">Texte alternatif de l&apos;image</label>
          <input id="imageAlt" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="content">Contenu (Markdown / MDX)</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={22}
          required
          className="font-mono text-sm"
        />
      </div>

      {error && <p className="text-sm text-alert">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-forest border border-forest/30 bg-forest/5 px-4 py-3" role="status">
          Enregistré. Le site est republié automatiquement : comptez 30 s à 1 min avant que la modification
          soit visible en ligne.
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn btn-ink">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete} disabled={saving} className="btn btn-line text-alert border-alert">
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
