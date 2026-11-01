import type { ReactNode } from "react";

/**
 * Champs de saisie partagés par les outils gratuits (panneau, permis ou DP,
 * surfaces). Même trait souligné que les formulaires du site (.field), avec
 * l'erreur reliée au champ pour les lecteurs d'écran.
 */

interface ChampProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  aide?: ReactNode;
  suffixe?: string;
  erreur?: string;
  placeholder?: string;
  type?: "text" | "date";
  numerique?: boolean;
  maxLength?: number;
  className?: string;
}

export function Champ({ id, label, value, onChange, aide, suffixe, erreur, placeholder, type = "text", numerique, maxLength, className }: ChampProps) {
  const idAide = aide ? `${id}-aide` : undefined;
  const idErreur = erreur ? `${id}-erreur` : undefined;
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      {aide && <p id={idAide} className="hint normal-case tracking-normal">{aide}</p>}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type={type}
          inputMode={numerique ? "decimal" : undefined}
          className="min-h-12"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={[idAide, idErreur].filter(Boolean).join(" ") || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffixe && <span className="shrink-0 text-ink-2">{suffixe}</span>}
      </div>
      {erreur && <p id={idErreur} className="text-sm text-alert">{erreur}</p>}
    </div>
  );
}

interface ChoixProps<T extends string | boolean> {
  name: string;
  legende: string;
  options: readonly (readonly [T, string, string?])[];
  value: T;
  onChange: (v: T) => void;
  colonnes?: 2 | 3;
}

/** Groupe de boutons radio ; chaque option peut porter une précision sous son libellé. */
export function Choix<T extends string | boolean>({ name, legende, options, value, onChange, colonnes = 2 }: ChoixProps<T>) {
  return (
    <fieldset className="field">
      <legend>{legende}</legend>
      <div className={`mt-2 grid gap-2 ${colonnes === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {options.map(([v, libelle, precision]) => (
          <label
            key={String(v)}
            className="flex min-h-12 cursor-pointer items-start gap-3 border border-stone-2 bg-paper px-4 py-3 transition-colors hover:border-ink-3 has-[:checked]:border-ink has-[:checked]:bg-stone has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bronze"
          >
            <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} className="accent-ink mt-1 h-4 w-4 shrink-0" />
            <span>
              <span className="block">{libelle}</span>
              {precision && <span className="mt-0.5 block text-sm text-ink-2">{precision}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Case({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-ink mt-1 h-4 w-4 shrink-0" />
      <span className="text-[0.95rem] leading-relaxed">{children}</span>
    </label>
  );
}
