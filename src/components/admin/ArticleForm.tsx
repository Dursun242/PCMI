"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/articles";

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
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
      router.push("/admin/articles");
      router.refresh();
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
