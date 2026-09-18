"use client";

import { useState } from "react";
import type { ChiffresCles } from "@data/chiffres";

export default function ChiffresForm({ chiffres }: { chiffres: ChiffresCles }) {
  const [permisDeposes, setPermisDeposes] = useState(chiffres.permisDeposes?.toString() ?? "");
  const [tauxAccordPremierDepot, setTauxAccordPremierDepot] = useState(chiffres.tauxAccordPremierDepot?.toString() ?? "");
  const [noteGoogle, setNoteGoogle] = useState(chiffres.noteGoogle?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/chiffres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permisDeposes, tauxAccordPremierDepot, noteGoogle }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-6">
      <div className="field">
        <label htmlFor="permisDeposes">Permis déposés à ce jour</label>
        <input
          id="permisDeposes"
          type="number"
          value={permisDeposes}
          onChange={(e) => setPermisDeposes(e.target.value)}
          placeholder="laisser vide pour masquer"
        />
      </div>
      <div className="field">
        <label htmlFor="tauxAccordPremierDepot">Taux d&apos;accord au premier dépôt (%)</label>
        <input
          id="tauxAccordPremierDepot"
          type="number"
          value={tauxAccordPremierDepot}
          onChange={(e) => setTauxAccordPremierDepot(e.target.value)}
          placeholder="laisser vide pour masquer"
        />
      </div>
      <div className="field">
        <label htmlFor="noteGoogle">Note Google (/5)</label>
        <input
          id="noteGoogle"
          type="number"
          step="0.1"
          value={noteGoogle}
          onChange={(e) => setNoteGoogle(e.target.value)}
          placeholder="laisser vide pour masquer"
        />
      </div>

      {error && <p className="text-sm text-alert">{error}</p>}
      {saved && <p className="text-sm text-forest">Enregistré.</p>}

      <button type="submit" disabled={saving} className="btn btn-ink">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
