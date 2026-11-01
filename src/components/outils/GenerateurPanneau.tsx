"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Case, Champ, Choix } from "@/components/outils/Champs";
import { trackEvent } from "@/lib/analytics";
import {
  LONGUEUR_MAX,
  nomFichier,
  PANNEAU_VIDE,
  svgPanneau,
  validerPanneau,
  type ChampPanneau,
  type PanneauSaisie,
  type TypeAutorisation,
} from "@/lib/panneau";

/** Textes d'attente de l'aperçu : on voit où va chaque mention avant de la saisir. */
const ATTENTE: Partial<Record<ChampPanneau, string>> = {
  numero: "PC 0XX XXX XX XXXXX",
  beneficiaire: "Nom du bénéficiaire",
  nature: "Nature des travaux",
  mairie: "Adresse de la mairie",
};

const dataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Ouvre le panneau seul, sur une page A3 paysage, et lance l'impression (ou l'enregistrement en PDF). */
function imprimer(svg: string, titre: string) {
  const fenetre = window.open("", "_blank");
  if (!fenetre) return false;
  fenetre.document.title = titre;
  const style = fenetre.document.createElement("style");
  style.textContent = "@page{size:A3 landscape;margin:8mm}html,body{margin:0}img{display:block;width:100%;height:auto}";
  const img = fenetre.document.createElement("img");
  img.alt = titre;
  img.onload = () => {
    fenetre.focus();
    fenetre.print();
  };
  img.src = dataUrl(svg);
  fenetre.document.head.appendChild(style);
  fenetre.document.body.appendChild(img);
  return true;
}

/**
 * Générateur de panneau de chantier. Tout le dessin vit dans src/lib/panneau.ts
 * (testé) : ce composant fait la saisie, l'aperçu et l'export. Rien n'est
 * envoyé à un serveur.
 */
export default function GenerateurPanneau() {
  const [saisie, setSaisie] = useState<PanneauSaisie>(PANNEAU_VIDE);
  const [essaye, setEssaye] = useState(false);
  const [bloque, setBloque] = useState(false);

  const maj = <K extends keyof PanneauSaisie>(k: K) => (v: PanneauSaisie[K]) => setSaisie((s) => ({ ...s, [k]: v }));
  const erreurs = validerPanneau(saisie);
  const valide = Object.keys(erreurs).length === 0;
  const err = (k: ChampPanneau) => (essaye ? erreurs[k] : undefined);

  const apercu = useMemo(() => {
    const avecAttente = { ...saisie };
    for (const [k, v] of Object.entries(ATTENTE) as [ChampPanneau, string][]) {
      if (avecAttente[k].trim() === "") avecAttente[k] = v;
    }
    return svgPanneau(avecAttente);
  }, [saisie]);

  function exporter(format: "svg" | "impression") {
    setEssaye(true);
    if (!valide) return;
    const svg = svgPanneau(saisie);
    trackEvent("panneau_export", { format, type: saisie.type });
    if (format === "impression") {
      setBloque(!imprimer(svg, "Panneau d'affichage"));
      return;
    }
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier(saisie);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      <form className="grid content-start gap-6" onSubmit={(e) => e.preventDefault()} noValidate>
        <Choix<TypeAutorisation>
          name="pn-type"
          legende="Autorisation obtenue"
          options={[["PC", "Permis de construire"], ["DP", "Déclaration préalable"]]}
          value={saisie.type}
          onChange={maj("type")}
        />
        <div className="grid gap-6 sm:grid-cols-[3fr_2fr]">
          <Champ id="pn-numero" label="Numéro" value={saisie.numero} onChange={maj("numero")} erreur={err("numero")} placeholder="PC 076 351 26 00012" maxLength={LONGUEUR_MAX.numero} aide="En haut de l'arrêté." />
          <Champ id="pn-date" label="Date de l'arrêté" type="date" value={saisie.dateDelivrance} onChange={maj("dateDelivrance")} erreur={err("dateDelivrance")} />
        </div>
        <Champ id="pn-beneficiaire" label="Bénéficiaire" value={saisie.beneficiaire} onChange={maj("beneficiaire")} erreur={err("beneficiaire")} placeholder="M. et Mme Martin" maxLength={LONGUEUR_MAX.beneficiaire} aide="Nom ou raison sociale, tel qu'il figure sur l'arrêté." />
        <Champ id="pn-nature" label="Nature des travaux" value={saisie.nature} onChange={maj("nature")} erreur={err("nature")} maxLength={LONGUEUR_MAX.nature} />
        <div className="grid gap-6 sm:grid-cols-3">
          <Champ id="pn-terrain" label="Terrain" suffixe="m²" numerique value={saisie.superficieTerrain} onChange={maj("superficieTerrain")} erreur={err("superficieTerrain")} placeholder="650" />
          <Champ id="pn-sp" label="Surface de plancher" suffixe="m²" numerique value={saisie.surfacePlancher} onChange={maj("surfacePlancher")} erreur={err("surfacePlancher")} placeholder="118,5" />
          <Champ id="pn-hauteur" label="Hauteur" suffixe="m" numerique value={saisie.hauteur} onChange={maj("hauteur")} erreur={err("hauteur")} placeholder="6,40" />
        </div>
        <p className="-mt-3 text-sm text-ink-2">
          Reprenez les chiffres exacts de l&apos;arrêté et du CERFA : surface de plancher autorisée, hauteur au faîtage par
          rapport au sol naturel.
        </p>
        <Champ id="pn-demolie" label="Surface démolie (s'il y a des démolitions)" suffixe="m²" numerique value={saisie.surfaceDemolie} onChange={maj("surfaceDemolie")} erreur={err("surfaceDemolie")} className="sm:max-w-[16rem]" />
        <Champ id="pn-mairie" label="Mairie où consulter le dossier" value={saisie.mairie} onChange={maj("mairie")} erreur={err("mairie")} placeholder="Mairie, 1 place de l'Hôtel de Ville, 76600 Le Havre" maxLength={LONGUEUR_MAX.mairie} aide="Adresse complète." />
        <div className="grid gap-3">
          <Case checked={saisie.secteurProtege} onChange={maj("secteurProtege")}>
            Terrain en secteur protégé (abords d&apos;un monument historique, site patrimonial remarquable, site classé) :
            ajoute la mention de l&apos;avis de l&apos;Architecte des Bâtiments de France.
          </Case>
          <Case checked={saisie.credit} onChange={maj("credit")}>
            Garder la petite mention « Modèle de panneau : permis-maison-individuelle.fr » en pied de panneau.
          </Case>
        </div>
      </form>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">Aperçu à l&apos;échelle · 120 × 80 cm</p>
        <div className="relative mt-3 border border-stone-2 bg-paper p-2 shadow-[0_18px_40px_-24px_rgba(27,31,29,0.45)] sm:p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- image générée dans le navigateur, rien à optimiser */}
          <img src={dataUrl(apercu)} alt="Aperçu du panneau d'affichage avec les mentions saisies" className="block h-auto w-full" width={1200} height={800} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-ink" onClick={() => exporter("svg")}>
            Télécharger le panneau
          </button>
          <button type="button" className="btn btn-line" onClick={() => exporter("impression")}>
            Imprimer ou enregistrer en PDF
          </button>
        </div>
        {essaye && !valide && (
          <p role="alert" className="mt-4 border-l-2 border-alert pl-4 text-sm text-alert">
            Il manque des mentions obligatoires : complétez les champs signalés.
          </p>
        )}
        {bloque && (
          <p role="alert" className="mt-4 border-l-2 border-alert pl-4 text-sm text-alert">
            Votre navigateur a bloqué la fenêtre d&apos;impression : autorisez les fenêtres pour ce site, ou téléchargez le
            panneau.
          </p>
        )}
        <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-2">
          Le fichier téléchargé est au format réel 120 × 80 cm (SVG vectoriel) : tout imprimeur ou service de reprographie
          l&apos;imprime sur un support rigide sans perte de qualité. L&apos;impression A3 sert à relire ou à garder une copie :
          le panneau posé sur le terrain doit dépasser 80 cm.
        </p>
        <p className="mt-6 border-t border-stone-2 pt-5 text-[0.95rem]">
          Permis accordé, prochaine étape : les plans que lisent vos artisans.{" "}
          <Link href="/plans-execution" className="text-ink underline decoration-brass underline-offset-4" onClick={() => trackEvent("cta_click", { source: "outil_panneau" })}>
            Nos plans d&apos;exécution à prix fixe
          </Link>
        </p>
      </div>
    </div>
  );
}
