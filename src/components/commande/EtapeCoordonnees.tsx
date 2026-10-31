"use client";

import { SURFACE_MAX } from "@/lib/formulaFinder";

export type ChampsCoordonnees = Record<string, string>;

interface Champ {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email";
  placeholder?: string;
  hint?: string;
  optionnel?: boolean;
}

const champsClient: Champ[] = [
  { name: "prenom", label: "Prénom", autoComplete: "given-name" },
  { name: "nom", label: "Nom", autoComplete: "family-name" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "telephone", label: "Téléphone", type: "tel", autoComplete: "tel", inputMode: "tel" },
  { name: "adresse", label: "Adresse", autoComplete: "street-address" },
  { name: "codePostal", label: "Code postal", autoComplete: "postal-code", inputMode: "numeric" },
  { name: "ville", label: "Ville", autoComplete: "address-level2" },
];

const champsTerrain: Champ[] = [
  { name: "terrainAdresse", label: "Adresse ou lieu-dit du terrain" },
  { name: "terrainCodePostal", label: "Code postal", inputMode: "numeric" },
  { name: "terrainCommune", label: "Commune" },
  {
    name: "surface",
    label: "Surface de plancher prévue (m²)",
    type: "number",
    inputMode: "numeric",
    placeholder: "ex. 120",
    hint: `Une estimation suffit. Commande en ligne jusqu'à ${SURFACE_MAX} m².`,
  },
  {
    name: "referenceCadastrale",
    label: "Référence cadastrale (facultatif)",
    placeholder: "ex. AB 123",
    hint: "Elle figure sur l'acte ou le compromis de vente.",
    optionnel: true,
  },
];

const COPIE_ADRESSE: [string, string][] = [
  ["adresse", "terrainAdresse"],
  ["codePostal", "terrainCodePostal"],
  ["ville", "terrainCommune"],
];

interface EtapeCoordonneesProps {
  valeurs: ChampsCoordonnees;
  onChange: (valeurs: ChampsCoordonnees) => void;
}

/** Coordonnées du client puis adresse du terrain : elles rempliront le devis et le mandat SEPA. */
export default function EtapeCoordonnees({ valeurs, onChange }: EtapeCoordonneesProps) {
  const set = (name: string, value: string) => onChange({ ...valeurs, [name]: value });

  const terrainALAdresse = (coche: boolean) =>
    onChange(
      COPIE_ADRESSE.reduce((acc, [de, vers]) => ({ ...acc, [vers]: coche ? (valeurs[de] ?? "") : "" }), { ...valeurs }),
    );

  const rendre = (c: Champ) => (
    <div className="field" key={c.name}>
      <label htmlFor={c.name}>{c.label}</label>
      <input
        id={c.name}
        name={c.name}
        type={c.type ?? "text"}
        required={!c.optionnel}
        autoComplete={c.autoComplete}
        inputMode={c.inputMode}
        placeholder={c.placeholder}
        min={c.type === "number" ? 1 : undefined}
        max={c.type === "number" ? SURFACE_MAX : undefined}
        value={valeurs[c.name] ?? ""}
        onChange={(e) => set(c.name, e.target.value)}
      />
      {c.hint && <span className="hint">{c.hint}</span>}
    </div>
  );

  return (
    <div className="grid gap-10">
      <fieldset className="grid gap-6">
        <legend className="display mb-4 text-3xl">Vos coordonnées</legend>
        <div className="grid gap-6 sm:grid-cols-2">{champsClient.map(rendre)}</div>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="display mb-4 text-3xl">Le terrain du permis</legend>
        <label className="flex items-center gap-3 text-sm text-ink-2">
          <input type="checkbox" className="accent-ink h-4 w-4" onChange={(e) => terrainALAdresse(e.target.checked)} />
          Le terrain est à l&apos;adresse ci-dessus
        </label>
        <div className="grid gap-6 sm:grid-cols-2">{champsTerrain.map(rendre)}</div>
      </fieldset>
    </div>
  );
}
