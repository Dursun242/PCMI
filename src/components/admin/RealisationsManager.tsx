"use client";

import { useState } from "react";
import type { Realisation } from "@data/realisations";

type Draft = {
  titre: string;
  commune: string;
  departement: string;
  surface: string;
  formule: Realisation["formule"];
  annee: string;
  images: string;
  piecesMontrees: string;
  permisAccorde: boolean;
};

function toDraft(r: Realisation): Draft {
  return {
    titre: r.titre,
    commune: r.commune,
    departement: r.departement,
    surface: String(r.surface),
    formule: r.formule,
    annee: String(r.annee),
    images: r.images.join(", "),
    piecesMontrees: r.piecesMontrees.join(", "),
    permisAccorde: r.permisAccorde,
  };
}

function emptyDraft(): Draft {
  return {
    titre: "",
    commune: "",
    departement: "",
    surface: "",
    formule: "essentiel",
    annee: String(new Date().getFullYear()),
    images: "",
    piecesMontrees: "",
    permisAccorde: true,
  };
}

function toRealisation(d: Draft): Realisation {
  return {
    titre: d.titre.trim(),
    commune: d.commune.trim(),
    departement: d.departement.trim(),
    surface: Number(d.surface) || 0,
    formule: d.formule,
    annee: Number(d.annee) || new Date().getFullYear(),
    images: d.images.split(",").map((s) => s.trim()).filter(Boolean),
    piecesMontrees: d.piecesMontrees.split(",").map((s) => s.trim()).filter(Boolean),
    permisAccorde: d.permisAccorde,
  };
}

export default function RealisationsManager({ realisations }: { realisations: Realisation[] }) {
  const [drafts, setDrafts] = useState<Draft[]>(realisations.map(toDraft));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function remove(i: number) {
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function add() {
    setDrafts((prev) => [...prev, emptyDraft()]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = drafts.map(toRealisation).filter((r) => r.titre && r.commune);
      const res = await fetch("/api/admin/realisations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realisations: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      setDrafts(payload.map(toDraft));
      setSaved(true);
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {drafts.map((d, i) => (
        <div key={i} className="border border-ink/10 bg-paper p-6 space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="field">
              <label>Titre</label>
              <input value={d.titre} onChange={(e) => update(i, { titre: e.target.value })} />
            </div>
            <div className="field">
              <label>Commune</label>
              <input value={d.commune} onChange={(e) => update(i, { commune: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="field">
              <label>Département</label>
              <input value={d.departement} onChange={(e) => update(i, { departement: e.target.value })} />
            </div>
            <div className="field">
              <label>Surface (m²)</label>
              <input type="number" value={d.surface} onChange={(e) => update(i, { surface: e.target.value })} />
            </div>
            <div className="field">
              <label>Formule</label>
              <select value={d.formule} onChange={(e) => update(i, { formule: e.target.value as Realisation["formule"] })}>
                <option value="essentiel">Essentiel</option>
                <option value="complet">Complet</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="field">
              <label>Année</label>
              <input type="number" value={d.annee} onChange={(e) => update(i, { annee: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="field">
              <label>Images (noms de fichiers dans public/realisations/, séparés par virgules)</label>
              <input value={d.images} onChange={(e) => update(i, { images: e.target.value })} />
            </div>
            <div className="field">
              <label>Pièces montrées (ex. PCMI 2, PCMI 6)</label>
              <input value={d.piecesMontrees} onChange={(e) => update(i, { piecesMontrees: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={d.permisAccorde}
              onChange={(e) => update(i, { permisAccorde: e.target.checked })}
            />
            Permis accordé
          </label>
          <button type="button" onClick={() => remove(i)} className="btn btn-line text-alert border-alert text-sm">
            Supprimer cette réalisation
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={add} className="btn btn-line">
          Ajouter une réalisation
        </button>
        <button type="button" onClick={save} disabled={saving} className="btn btn-ink">
          {saving ? "Enregistrement…" : "Enregistrer tout"}
        </button>
        {error && <p className="text-sm text-alert">{error}</p>}
        {saved && <p className="text-sm text-forest">Enregistré.</p>}
      </div>
    </div>
  );
}
