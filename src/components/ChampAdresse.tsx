"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Service d'adresses de l'IGN (Géoplateforme), le même que celui qui trouve la parcelle côté serveur. */
const API = "https://data.geopf.fr/geocodage/search";
const MIN_CARACTERES = 3;
const DELAI_FRAPPE_MS = 250;
const MAX_SUGGESTIONS = 6;

interface Props {
  id: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  /** Appelé quand le visiteur choisit une suggestion (clic, Entrée). */
  onChoisir: (adresse: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  minLength?: number;
}

/**
 * Champ d'adresse avec suggestions pendant la frappe (liste déroulante ARIA
 * « combobox ») : flèches pour parcourir, Entrée pour choisir, Échap pour
 * fermer. Sans réseau ou sans suggestion, c'est un champ texte ordinaire.
 */
export default function ChampAdresse({ id, name, value, onChange, onChoisir, placeholder, className, required, minLength }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const choisie = useRef<string | null>(null);
  const liste = useId();

  useEffect(() => {
    const q = value.trim();
    // Rien à chercher : trop court, ou c'est la suggestion qu'on vient de choisir.
    if (q.length < MIN_CARACTERES || q === choisie.current) return;
    const ctrl = new AbortController();
    const minuterie = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, autocomplete: "1", index: "address", limit: String(MAX_SUGGESTIONS) });
        const r = await fetch(`${API}?${params}`, { signal: ctrl.signal });
        if (!r.ok) return;
        const json = (await r.json()) as { features?: { properties?: { label?: string } }[] };
        const labels = (json.features ?? []).map((f) => f.properties?.label).filter((l): l is string => Boolean(l));
        setSuggestions([...new Set(labels)]);
        setActif(-1);
        setOuvert(labels.length > 0);
      } catch {
        // Réseau coupé ou frappe suivante : le champ reste utilisable sans suggestions.
      }
    }, DELAI_FRAPPE_MS);
    return () => {
      clearTimeout(minuterie);
      ctrl.abort();
    };
  }, [value]);

  const choisir = (adresse: string) => {
    choisie.current = adresse;
    onChange(adresse);
    setOuvert(false);
    onChoisir(adresse);
  };

  const visible = ouvert && suggestions.length > 0;

  return (
    <div className="relative w-full">
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={visible}
        aria-controls={liste}
        aria-autocomplete="list"
        aria-activedescendant={visible && actif >= 0 ? `${liste}-${actif}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          choisie.current = null;
          onChange(e.target.value);
          if (e.target.value.trim().length < MIN_CARACTERES) setOuvert(false);
        }}
        onKeyDown={(e) => {
          if (!visible) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (e.key === "Enter" && actif >= 0) {
            e.preventDefault();
            choisir(suggestions[actif]);
          } else if (e.key === "Escape") {
            setOuvert(false);
          }
        }}
        onBlur={() => setOuvert(false)}
        onFocus={() => setOuvert(suggestions.length > 0 && value.trim() !== choisie.current)}
        placeholder={placeholder}
        className={className}
        required={required}
        minLength={minLength}
      />
      <ul
        id={liste}
        role="listbox"
        aria-label="Adresses proposées"
        hidden={!visible}
        className="absolute inset-x-0 top-full z-30 mt-1 border border-stone-2 bg-paper py-1 text-left shadow-[0_18px_32px_rgb(27_31_29/0.14)]"
      >
        {suggestions.map((s, i) => (
          <li
            key={s}
            id={`${liste}-${i}`}
            role="option"
            aria-selected={i === actif}
            // mousedown plutôt que click : il passe avant le blur qui fermerait la liste.
            onMouseDown={(e) => {
              e.preventDefault();
              choisir(s);
            }}
            onMouseEnter={() => setActif(i)}
            className={`cursor-pointer px-4 py-2.5 text-[0.95rem] text-ink ${i === actif ? "bg-stone" : ""}`}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
