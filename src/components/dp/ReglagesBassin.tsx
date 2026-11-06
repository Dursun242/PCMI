"use client";

import { BORNES, COTES, MATERIAUX_LOCAL, type MateriauLocal, RECUL_CONSEILLE_M, SECURITES, TYPES_BASSIN, orientationCote, regimeIndicatif, surfaceBassin, type Bassin, type CoteBassin, type Securite, type TypeBassin } from "@/lib/dpPiscine";

interface Props {
  bassin: Bassin;
  onChange: (b: Bassin) => void;
  depasse: boolean;
  /** Plus courte distance du bassin aux limites du terrain (m). */
  distance: number | null;
}

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function Nombre({ id, label, valeur, bornes, pas, onChange, aide }: {
  id: string;
  label: string;
  valeur: number;
  bornes: readonly [number, number];
  pas: number;
  onChange: (n: number) => void;
  aide?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="min-h-12"
        min={bornes[0]}
        max={bornes[1]}
        step={pas}
        value={valeur}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(bornes[1], Math.max(bornes[0], n)));
        }}
      />
      {aide && <p className="hint">{aide}</p>}
    </div>
  );
}

/** Dimensions, orientation, margelles, plage, local technique et sécurité du bassin. */
export default function ReglagesBassin({ bassin: b, onChange, depasse, distance }: Props) {
  const maj = (p: Partial<Bassin>) => onChange({ ...b, ...p });
  const uniforme = COTES.every((k) => b.plage[k] === b.plage.petit_cote_1);
  const regime = regimeIndicatif(b);
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <Nombre id="dp-l" label="Longueur du bassin (m)" valeur={b.longueur} bornes={BORNES.longueur} pas={0.1} onChange={(n) => maj({ longueur: n })} />
        <Nombre id="dp-w" label="Largeur du bassin (m)" valeur={b.largeur} bornes={BORNES.largeur} pas={0.1} onChange={(n) => maj({ largeur: n })} />
        <Nombre id="dp-p" label="Profondeur (m)" valeur={b.profondeur} bornes={BORNES.profondeur} pas={0.05} onChange={(n) => maj({ profondeur: n })} aide="Fond plat." />
      </div>
      <p aria-live="polite" className={regime === "dp" ? "text-sm text-ink-2" : "border-l-2 border-alert pl-4 text-sm text-alert"}>
        Bassin de {fmt(surfaceBassin(b))} m².{" "}
        {regime === "aucune" && "Jusqu'à 10 m² (hors secteur protégé), aucune déclaration n'est nécessaire."}
        {regime === "pc" && "Au-delà de 100 m², il faut un permis de construire : contactez-nous."}
        {regime === "dp" && "Entre 10 et 100 m² : déclaration préalable."}
      </p>

      <div className="field">
        <label htmlFor="dp-angle">Orientation du bassin : {Math.round(((b.angle % 180) + 180) % 180)}°</label>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-line min-h-12 px-4" onClick={() => maj({ angle: b.angle - 1 })} aria-label="Tourner de 1° dans le sens des aiguilles d'une montre">↻ 1°</button>
          <input id="dp-angle" type="range" min={0} max={179} step={1} className="w-full accent-ink" value={Math.round(((b.angle % 180) + 180) % 180)} onChange={(e) => maj({ angle: Number(e.target.value) })} />
          <button type="button" className="btn btn-line min-h-12 px-4" onClick={() => maj({ angle: b.angle + 1 })} aria-label="Tourner de 1° dans le sens inverse">↺ 1°</button>
        </div>
        <p className="hint">Placez le bassin avec la poignée noire sur la carte, ou touchez la carte à l&apos;endroit voulu.</p>
      </div>
      {depasse && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">La plage ou le bassin dépasse de votre terrain : déplacez-le ou réduisez-le.</p>}
      {!depasse && distance !== null && (
        <p aria-live="polite" className={distance < RECUL_CONSEILLE_M ? "border-l-2 border-alert pl-4 text-sm text-alert" : "text-sm text-ink-2"}>
          Bassin à <strong>{fmt(distance)} m</strong> de la limite la plus proche (trait pointillé sur la carte).
          {distance < RECUL_CONSEILLE_M &&
            ` La plupart des PLU demandent ${RECUL_CONSEILLE_M} m : éloignez le bassin de la limite, sinon le dossier risque d'être refusé.`}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Nombre id="dp-m" label="Margelles (m)" valeur={b.margelle} bornes={BORNES.margelle} pas={0.05} onChange={(n) => maj({ margelle: n })} aide="Largeur de la margelle autour du bassin." />
        {uniforme && (
          <Nombre
            id="dp-plage"
            label="Plage autour (m)"
            valeur={b.plage.petit_cote_1}
            bornes={BORNES.plage}
            pas={0.1}
            onChange={(n) => maj({ plage: Object.fromEntries(COTES.map((k) => [k, n])) as Record<CoteBassin, number> })}
            aide="0 : pas de plage, la pelouse va jusqu'aux margelles."
          />
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-[0.95rem]">
        <input
          type="checkbox"
          className="accent-ink h-4 w-4"
          checked={!uniforme}
          onChange={(e) => {
            if (!e.target.checked) maj({ plage: Object.fromEntries(COTES.map((k) => [k, b.plage.petit_cote_1])) as Record<CoteBassin, number> });
            else maj({ plage: { ...b.plage, petit_cote_2: b.plage.petit_cote_2 + 0.5 } });
          }}
        />
        Une plage différente selon les côtés
      </label>
      {!uniforme && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {COTES.map((k) => (
            <Nombre
              key={k}
              id={`dp-plage-${k}`}
              label={`Côté ${orientationCote(b.angle, k)} (m)`}
              valeur={b.plage[k]}
              bornes={BORNES.plage}
              pas={0.1}
              onChange={(n) => maj({ plage: { ...b.plage, [k]: n } })}
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="dp-type">Type de piscine</label>
          <select id="dp-type" className="min-h-12 border border-stone-2 bg-paper px-3" value={b.type} onChange={(e) => maj({ type: e.target.value as TypeBassin })}>
            {Object.entries(TYPES_BASSIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dp-secu">Dispositif de sécurité (obligatoire)</label>
          <select id="dp-secu" className="min-h-12 border border-stone-2 bg-paper px-3" value={b.securite} onChange={(e) => maj({ securite: e.target.value as Securite })}>
            {Object.entries(SECURITES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-[0.95rem]">
        <input type="checkbox" className="accent-ink h-4 w-4" checked={b.localTechnique} onChange={(e) => maj({ localTechnique: e.target.checked })} />
        Local technique (2,00 x 1,50 m, hauteur 1,80 m, au bout du bassin)
      </label>
      {b.localTechnique && (
        <div className="field">
          <label htmlFor="dp-local-mat">Aspect du local technique (plan des façades DPC4)</label>
          <select id="dp-local-mat" className="min-h-12 border border-stone-2 bg-paper px-3" value={b.materiauLocal ?? "bois"} onChange={(e) => maj({ materiauLocal: e.target.value as MateriauLocal })}>
            {Object.entries(MATERIAUX_LOCAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}
      <label className="flex cursor-pointer items-start gap-3 text-[0.95rem]">
        <input type="checkbox" className="accent-ink mt-1 h-4 w-4" checked={b.arbresAbattus === true} onChange={(e) => maj({ arbresAbattus: e.target.checked })} />
        <span>
          Des arbres seront abattus pour faire la piscine
          <span className="block text-sm text-ink-2">La mairie veut les voir sur le plan de masse : nous les y reportons avec vous avant l&apos;envoi.</span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 text-[0.95rem]">
        <input type="checkbox" className="accent-ink mt-1 h-4 w-4" checked={b.visibleRue} onChange={(e) => maj({ visibleRue: e.target.checked })} />
        <span>
          La piscine sera visible depuis la rue
          <span className="block text-sm text-ink-2">Il faut alors deux photos prises de la rue et un photomontage : on vous guide juste en dessous.</span>
        </span>
      </label>
    </div>
  );
}
