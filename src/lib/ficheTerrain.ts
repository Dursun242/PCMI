/**
 * Fiche « Mon terrain est-il constructible ? » : lecture des données publiques
 * d'une parcelle (Géoportail de l'urbanisme, Géorisques) et traduction en clair
 * de ce qu'elles changent pour un projet de maison.
 *
 * Module pur (testé) : les données arrivent déjà chargées (ficheTerrainSources.ts),
 * l'aperçu, le PDF et les e-mails ne font qu'afficher ce que rend analyserTerrain().
 *
 * Règle de prudence : jamais de « constructible : oui ». La fiche dit ce que
 * disent les données publiques ; seul un certificat d'urbanisme fait foi.
 */

export type EtatSource = "ok" | "indisponible";
export type Niveau = "favorable" | "info" | "vigilance" | "alerte" | "inconnu";

export interface ZoneUrba {
  libelle: string;
  libelong: string;
  /** U, AUc, AUs, A, N, Ah, Nh, Nd… (standard CNIG). */
  typezone: string;
  reglementUrl: string | null;
}

export interface SecteurCC {
  libelle: string;
  /** 01 ouvert à la construction, 02 réservé aux activités, 03 non ouvert, 99 autre (standard CNIG). */
  typesect: string;
  reglementUrl: string | null;
}

export interface DocumentUrba {
  /** PLU, PLUi, POS, CC, PSMV… */
  type: string;
  nom: string;
  /** AAAAMMJJ, date de validité ou d'approbation quand elle est connue. */
  date: string | null;
  /** Date de mise en ligne sur le Géoportail (ISO). */
  miseEnLigne: string | null;
}

export interface Mention {
  libelle: string;
  txt: string;
}

export interface Servitude {
  /** Code de la servitude d'utilité publique, en minuscules : ac1, pm1, el7… */
  type: string;
  nom: string;
}

export interface Cavite {
  type: string;
  nom: string;
  /** Distance au centre de la parcelle, en mètres. */
  distance: number;
}

export interface DonneesTerrain {
  parcelle: {
    idu: string;
    section: string;
    numero: string;
    commune: string;
    codeInsee: string;
    contenance: number;
    /** Anneaux extérieurs en [longitude, latitude]. */
    contours: [number, number][][];
    centre: [number, number];
  };
  adresse: string | null;
  urbanisme: {
    etat: EtatSource;
    rnu: boolean | null;
    document: DocumentUrba | null;
    zones: ZoneUrba[];
    secteursCC: SecteurCC[];
    prescriptions: Mention[];
    informations: Mention[];
    servitudes: Servitude[];
  };
  risques: {
    etat: EtatSource;
    /** 0 non concerné, 1 faible, 2 moyenne, 3 forte ; null si inconnu. */
    argiles: number | null;
    cavites: Cavite[] | null;
    mouvements: Cavite[] | null;
    /** Zone sismique 1 à 5. */
    sismicite: number | null;
    /** Potentiel radon 1 à 3. */
    radon: number | null;
    /** Risques recensés sur la commune (GASPAR), en libellés longs. */
    commune: string[] | null;
  };
}

export interface Voyant {
  cle: "zone" | "inondation" | "cavites" | "argiles" | "patrimoine";
  titre: string;
  niveau: Niveau;
  resume: string;
}

export interface Point {
  titre: string;
  texte: string;
  niveau: Niveau;
}

export interface LigneDetail {
  libelle: string;
  valeur: string;
}

export interface Analyse {
  zone: { titre: string; detail: string; niveau: Niveau };
  voyants: Voyant[];
  /** « Ce que ça change pour votre projet », du plus important au moins important. */
  points: Point[];
  urbanisme: LigneDetail[];
  risques: LigneDetail[];
  liens: { reglement: string | null; geoportail: string; georisques: string };
  avertissements: string[];
}

/* ---------- Dictionnaires ---------- */

/** Servitudes d'utilité publique les plus courantes autour d'une maison. */
export const SERVITUDES: Record<string, string> = {
  ac1: "Abords d'un monument historique",
  ac2: "Site inscrit ou classé",
  ac3: "Réserve naturelle",
  ac4: "Site patrimonial remarquable",
  as1: "Périmètre de protection d'un captage d'eau potable",
  el3: "Halage et marchepied le long d'un cours d'eau",
  el7: "Alignement des voies publiques",
  el9: "Passage des piétons sur le littoral",
  i1: "Canalisation d'hydrocarbures",
  i3: "Canalisation de gaz",
  i4: "Ligne électrique",
  int1: "Voisinage d'un cimetière",
  pm1: "Plan de prévention des risques naturels",
  pm2: "Installation classée (anciennes servitudes)",
  pm3: "Plan de prévention des risques technologiques",
  pt1: "Protection des télécommunications",
  pt2: "Faisceau hertzien",
  t1: "Voie ferrée",
  t4: "Servitude aéronautique de balisage",
  t5: "Servitude aéronautique de dégagement",
  t7: "Servitude aéronautique hors dégagement",
};

const ARGILES = ["Non concerné", "Exposition faible", "Exposition moyenne", "Exposition forte"];
const SISMICITE = ["", "Très faible", "Faible", "Modérée", "Moyenne", "Forte"];
const RADON = ["", "Faible", "Faible, avec facteurs aggravants", "Significatif"];

/** Départements de craie où les marnières sont nombreuses et la base nationale incomplète. */
const DEPARTEMENTS_MARNIERES = new Set(["76", "27", "14", "60", "80", "02", "28", "51"]);

/** Distance sous laquelle un indice de cavité est traité comme une alerte (périmètre de sécurité courant en Normandie). */
export const RAYON_CAVITE_ALERTE = 60;

const RE = {
  inondation: /inond|ppri|submersion|crue|ruissel|nappe|débordement/i,
  cavite: /cavit|marni|carri[eè]re|souterrain|effondr/i,
  mouvement: /mouvement|éboul|eboul|glissement|falaise/i,
  emplacementReserve: /emplacement\s*r[ée]serv/i,
  ebc: /bois[ée]s?\s*class|\bebc\b/i,
  patrimoine: /patrimoin|l\.?\s*151-1[9]|l\.?\s*151-23|remarquable|à prot[ée]ger/i,
  oap: /\boap\b|orientation d.am[ée]nagement/i,
};

/* ---------- Mise en forme ---------- */

/** « 20260212 » → « 12/02/2026 » ; une date ISO garde son jour. */
export function dateFr(v: string | null): string | null {
  if (!v) return null;
  const m = /^(\d{4})-?(\d{2})-?(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

const metres = (d: number) => `${Math.round(d).toLocaleString("fr-FR")} m`;

export function libelleServitude(s: Servitude): string {
  const base = SERVITUDES[s.type] ?? s.type.toUpperCase();
  if (!s.nom) return base;
  // « Site patrimonial remarquable de Pont-Audemer » dit déjà tout : pas de « Site patrimonial remarquable : Site… ».
  return s.nom.toLowerCase().includes(base.toLowerCase()) ? s.nom : `${base} : ${s.nom}`;
}

/** « Plan des hauteurs », « S3 : Desserte élargie » (sans répéter le code déjà dans le libellé). */
export function libelleMention(m: Mention): string {
  return m.txt && !m.libelle.toLowerCase().includes(m.txt.toLowerCase()) ? `${m.libelle} : ${m.txt}` : m.libelle;
}

/** Accorde chaque mot du groupe nominal : « 7 cavités recensées ». */
const pluriel = (n: number, mots: string) => `${n} ${n > 1 ? mots.split(" ").map((m) => `${m}s`).join(" ") : mots}`;

/* ---------- Zone ---------- */

function analyserZone(d: DonneesTerrain): Analyse["zone"] {
  const u = d.urbanisme;
  if (u.etat === "indisponible") {
    return { titre: "Zonage non disponible", detail: "Le Géoportail de l'urbanisme ne répond pas pour le moment.", niveau: "inconnu" };
  }
  const z = u.zones[0];
  if (z) {
    const nom = `Zone ${z.libelle}${z.libelong ? ` : ${z.libelong.replace(/^\s*\S+\s*:\s*/, "")}` : ""}`;
    const t = z.typezone.toUpperCase();
    if (t === "U") return { titre: nom, detail: "Zone urbaine : constructible a priori, selon le règlement de la zone.", niveau: "favorable" };
    if (t === "AUC") return { titre: nom, detail: "Zone à urbaniser ouverte : constructible sous conditions (équipements, orientations d'aménagement).", niveau: "vigilance" };
    if (t === "AUS") return { titre: nom, detail: "Zone à urbaniser fermée : pas constructible tant que le PLU n'est pas modifié.", niveau: "alerte" };
    if (t === "AH" || t === "NH") return { titre: nom, detail: "Secteur de taille limitée en zone agricole ou naturelle : constructions possibles mais très encadrées.", niveau: "vigilance" };
    if (t.startsWith("A")) return { titre: nom, detail: "Zone agricole : une maison neuve y est en principe interdite, sauf pour un exploitant agricole.", niveau: "alerte" };
    if (t.startsWith("N")) return { titre: nom, detail: "Zone naturelle : en principe inconstructible, seules des extensions ou annexes limitées sont admises.", niveau: "alerte" };
    return { titre: nom, detail: "Type de zone particulier : lisez le règlement de la zone.", niveau: "inconnu" };
  }
  const s = u.secteursCC[0];
  if (s) {
    const nom = `Carte communale, secteur ${s.libelle}`;
    if (s.typesect === "01") return { titre: nom, detail: "Secteur ouvert à la construction : constructible a priori.", niveau: "favorable" };
    if (s.typesect === "02") return { titre: nom, detail: "Secteur réservé aux activités : une maison n'y est en principe pas admise.", niveau: "alerte" };
    if (s.typesect === "03") return { titre: nom, detail: "Secteur non ouvert à la construction : une maison neuve y est en principe interdite.", niveau: "alerte" };
    return { titre: nom, detail: "Type de secteur particulier : renseignez-vous en mairie.", niveau: "inconnu" };
  }
  if (u.rnu) {
    return {
      titre: "Règlement national d'urbanisme",
      detail: "Pas de PLU : on ne construit en principe que dans les parties déjà urbanisées de la commune.",
      niveau: "vigilance",
    };
  }
  return { titre: "Zonage non trouvé", detail: "Aucun document d'urbanisme publié sur le Géoportail pour cette parcelle : renseignez-vous en mairie.", niveau: "inconnu" };
}

/* ---------- Risques et contraintes ---------- */

const toutesMentions = (d: DonneesTerrain) => [...d.urbanisme.prescriptions, ...d.urbanisme.informations];
const texteMention = (m: Mention) => `${m.libelle} ${m.txt}`;

function voyantInondation(d: DonneesTerrain): Voyant {
  const ppr = d.urbanisme.servitudes.filter((s) => s.type === "pm1" && (RE.inondation.test(s.nom) || !RE.mouvement.test(s.nom)));
  const mention = toutesMentions(d).find((m) => RE.inondation.test(texteMention(m)));
  if (ppr.length || mention) {
    const nom = ppr[0]?.nom || mention?.libelle || "";
    const quoi = !nom ? "un plan de prévention des risques" : /^(ppr|zone)/i.test(nom) ? `le ${nom.replace(/^ZONE/, "zonage")}` : nom;
    return {
      cle: "inondation",
      titre: "Inondation",
      niveau: "alerte",
      resume: `La parcelle est concernée par ${quoi} : règles de construction particulières, parfois inconstructible.`,
    };
  }
  if (d.risques.etat === "indisponible" && d.urbanisme.etat === "indisponible") {
    return { cle: "inondation", titre: "Inondation", niveau: "inconnu", resume: "Données indisponibles pour le moment." };
  }
  if (d.risques.commune?.some((r) => RE.inondation.test(r))) {
    return {
      cle: "inondation",
      titre: "Inondation",
      niveau: "info",
      resume: "Risque recensé sur la commune, pas de plan de prévention connu sur la parcelle.",
    };
  }
  return { cle: "inondation", titre: "Inondation", niveau: "favorable", resume: "Aucun risque d'inondation recensé." };
}

function voyantCavites(d: DonneesTerrain): Voyant {
  const mention = toutesMentions(d).find((m) => RE.cavite.test(texteMention(m)));
  const cav = d.risques.cavites;
  const proche = cav?.[0];
  if (mention || (proche && proche.distance <= RAYON_CAVITE_ALERTE)) {
    return {
      cle: "cavites",
      titre: "Cavités, marnières",
      niveau: "alerte",
      resume: proche && proche.distance <= RAYON_CAVITE_ALERTE
        ? `Indice de cavité souterraine à environ ${metres(proche.distance)} du terrain.`
        : `Le document d'urbanisme signale un risque lié aux cavités sur la parcelle (${mention?.libelle}).`,
    };
  }
  if (cav === null) return { cle: "cavites", titre: "Cavités, marnières", niveau: "inconnu", resume: "Données indisponibles pour le moment." };
  if (proche) {
    return {
      cle: "cavites",
      titre: "Cavités, marnières",
      niveau: "vigilance",
      resume: `${pluriel(cav.length, "cavité recensée")} dans un rayon de 500 m, la plus proche à environ ${metres(proche.distance)}.`,
    };
  }
  const craie = DEPARTEMENTS_MARNIERES.has(d.parcelle.codeInsee.slice(0, 2));
  return {
    cle: "cavites",
    titre: "Cavités, marnières",
    niveau: craie ? "info" : "favorable",
    resume: craie
      ? "Aucune cavité dans la base nationale à moins de 500 m, mais cette base est incomplète dans votre département."
      : "Aucune cavité recensée à moins de 500 m.",
  };
}

function voyantArgiles(d: DonneesTerrain): Voyant {
  const a = d.risques.argiles;
  if (a === null) return { cle: "argiles", titre: "Argiles", niveau: "inconnu", resume: "Données indisponibles pour le moment." };
  if (a >= 2) {
    return {
      cle: "argiles",
      titre: "Argiles",
      niveau: "vigilance",
      resume: `${ARGILES[a]} au retrait-gonflement des argiles : étude de sol obligatoire avant de vendre et de construire.`,
    };
  }
  return { cle: "argiles", titre: "Argiles", niveau: "favorable", resume: `${ARGILES[a] ?? "Non concerné"} au retrait-gonflement des argiles.` };
}

function voyantPatrimoine(d: DonneesTerrain): Voyant {
  const sup = d.urbanisme.servitudes.filter((s) => ["ac1", "ac2", "ac4"].includes(s.type));
  if (sup.length) {
    return {
      cle: "patrimoine",
      titre: "Patrimoine",
      niveau: "vigilance",
      resume: `${libelleServitude(sup[0])} : l'Architecte des Bâtiments de France donne son avis sur le projet.`,
    };
  }
  if (d.urbanisme.etat === "indisponible") return { cle: "patrimoine", titre: "Patrimoine", niveau: "inconnu", resume: "Données indisponibles pour le moment." };
  return { cle: "patrimoine", titre: "Patrimoine", niveau: "favorable", resume: "Pas de secteur protégé recensé sur la parcelle." };
}

/* ---------- Ce que ça change pour le projet ---------- */

function points(d: DonneesTerrain, zone: Analyse["zone"], voyants: Voyant[]): Point[] {
  const p: Point[] = [];
  const v = (c: Voyant["cle"]) => voyants.find((x) => x.cle === c)!;
  if (zone.niveau === "alerte") {
    p.push({ titre: "Constructibilité", niveau: "alerte", texte: `${zone.detail} Ne signez pas d'achat sans un certificat d'urbanisme opérationnel favorable.` });
  } else if (zone.niveau === "vigilance") {
    p.push({ titre: "Constructibilité", niveau: "vigilance", texte: `${zone.detail} Un certificat d'urbanisme opérationnel vous donnera une réponse écrite de la mairie.` });
  }
  if (v("inondation").niveau === "alerte") {
    p.push({
      titre: "Plan de prévention des risques",
      niveau: "alerte",
      texte: "Lisez le règlement du plan de prévention pour la zone du terrain : il peut imposer une hauteur de plancher, interdire un sous-sol ou rendre le terrain inconstructible. Le permis devra en tenir compte.",
    });
  }
  if (v("cavites").niveau === "alerte") {
    p.push({
      titre: "Cavité souterraine",
      niveau: "alerte",
      texte: "Un périmètre de sécurité (souvent 60 m en Normandie) entoure les indices de cavités : tant qu'il n'est pas levé par une étude avec sondages, le terrain peut être déclaré inconstructible. Faites-le vérifier en mairie avant l'achat.",
    });
  } else if (v("cavites").niveau === "vigilance" || v("cavites").niveau === "info") {
    p.push({
      titre: "Cavités",
      niveau: "info",
      texte: "Consultez le recensement des indices de cavités de la commune, plus complet que la base nationale : il est en mairie ou dans les annexes du PLU.",
    });
  }
  if (v("argiles").niveau === "vigilance") {
    p.push({
      titre: "Étude de sol",
      niveau: "vigilance",
      texte: "Le vendeur doit fournir une étude géotechnique préalable (G1) ; avant de construire, une étude de conception fixe les fondations. Comptez quelques milliers d'euros de fondations adaptées.",
    });
  }
  if (v("patrimoine").niveau === "vigilance") {
    p.push({
      titre: "Architecte des Bâtiments de France",
      niveau: "vigilance",
      texte: "Un mois d'instruction en plus, et des exigences sur l'aspect : matériaux, couleurs, toiture, menuiseries. Un dossier soigné passe mieux du premier coup.",
    });
  }
  const er = toutesMentions(d).find((m) => RE.emplacementReserve.test(texteMention(m)));
  if (er) p.push({ titre: "Emplacement réservé", niveau: "alerte", texte: "Une partie du terrain peut être réservée à un futur équipement public (voie, réseau) : rien ne s'y construit." });
  const ebc = toutesMentions(d).find((m) => RE.ebc.test(texteMention(m)));
  if (ebc) p.push({ titre: "Espace boisé classé", niveau: "vigilance", texte: "Les arbres protégés ne peuvent pas être abattus et leur emprise est inconstructible." });
  const pat = toutesMentions(d).find((m) => RE.patrimoine.test(texteMention(m)) && !RE.ebc.test(texteMention(m)));
  if (pat) p.push({ titre: "Élément protégé par le PLU", niveau: "vigilance", texte: `${pat.libelle} : un bâtiment, un mur ou une haie à préserver, à repérer sur le plan de zonage.` });
  const oap = toutesMentions(d).find((m) => RE.oap.test(texteMention(m)));
  if (oap) {
    p.push({ titre: "Orientation d'aménagement", niveau: "info", texte: `${oap.libelle} : le projet doit en respecter les principes (implantation, accès, plantations, qualité architecturale).` });
  }
  if ((d.risques.sismicite ?? 0) >= 3) {
    p.push({ titre: "Séisme", niveau: "vigilance", texte: `Zone de sismicité ${d.risques.sismicite} : les règles de construction parasismique s'appliquent à une maison.` });
  }
  if (d.risques.radon === 3) {
    p.push({ titre: "Radon", niveau: "info", texte: "Potentiel radon significatif : une bonne ventilation du sol et du vide sanitaire est recommandée." });
  }
  // Les plus graves d'abord, six au plus, puis toujours le certificat d'urbanisme.
  const rang: Record<Niveau, number> = { alerte: 0, vigilance: 1, info: 2, inconnu: 3, favorable: 4 };
  const tries = p.map((x, i) => ({ x, i })).sort((a, b) => rang[a.x.niveau] - rang[b.x.niveau] || a.i - b.i).map((e) => e.x);
  return [
    ...tries.slice(0, 6),
    {
      titre: "Avant d'acheter",
      niveau: "info",
      texte: "Demandez un certificat d'urbanisme opérationnel : la mairie confirme par écrit que votre projet est réalisable, et les règles sont figées pendant 18 mois.",
    },
  ];
}

/* ---------- Détail ---------- */

function detailUrbanisme(d: DonneesTerrain, zone: Analyse["zone"]): LigneDetail[] {
  const u = d.urbanisme;
  const l: LigneDetail[] = [];
  if (u.document) {
    const date = dateFr(u.document.date);
    const { type, nom } = u.document;
    const intitule = nom && nom.toUpperCase().startsWith(type.toUpperCase()) ? nom : [type, nom].filter(Boolean).join(" ");
    l.push({ libelle: "Document", valeur: `${intitule}${date ? `, en vigueur au ${date}` : ""}` });
  } else if (u.rnu) {
    l.push({ libelle: "Document", valeur: "Règlement national d'urbanisme (pas de PLU)" });
  }
  l.push({ libelle: "Zone", valeur: zone.titre });
  for (const s of u.servitudes) l.push({ libelle: "Servitude", valeur: libelleServitude(s) });
  for (const m of u.prescriptions.slice(0, 6)) l.push({ libelle: "Prescription", valeur: libelleMention(m) });
  for (const m of u.informations.slice(0, 4)) l.push({ libelle: "Information", valeur: libelleMention(m) });
  return l;
}

function detailRisques(d: DonneesTerrain): LigneDetail[] {
  const r = d.risques;
  if (r.etat === "indisponible") return [{ libelle: "Risques", valeur: "Géorisques ne répond pas pour le moment." }];
  const l: LigneDetail[] = [];
  if (r.argiles !== null) l.push({ libelle: "Argiles", valeur: ARGILES[r.argiles] ?? "Inconnu" });
  if (r.cavites) {
    l.push({
      libelle: "Cavités (500 m autour)",
      valeur: r.cavites.length
        ? r.cavites.slice(0, 4).map((c) => `${c.type || "cavité"} à ${metres(c.distance)}`).join(" ; ")
        : "Aucune dans la base nationale",
    });
  }
  if (r.mouvements) {
    l.push({
      libelle: "Mouvements de terrain (500 m)",
      valeur: r.mouvements.length ? r.mouvements.slice(0, 3).map((c) => `${c.type} à ${metres(c.distance)}`).join(" ; ") : "Aucun recensé",
    });
  }
  if (r.sismicite) l.push({ libelle: "Sismicité", valeur: `Zone ${r.sismicite}, ${SISMICITE[r.sismicite]?.toLowerCase() ?? ""}` });
  if (r.radon) l.push({ libelle: "Radon", valeur: RADON[r.radon] ?? "Inconnu" });
  const principaux = (r.commune ?? []).filter((x) => !/^Par |^Effet |^Affaissements|^Eboulement|^Tassements/.test(x));
  if (principaux.length) l.push({ libelle: "Risques recensés sur la commune", valeur: principaux.join(", ") });
  return l;
}

/* ---------- Liens ---------- */

export function lienGeoportail([lon, lat]: [number, number]): string {
  return `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${lon.toFixed(6)}&lat=${lat.toFixed(6)}&zoom=18`;
}

export const LIEN_GEORISQUES = "https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi";

/* ---------- Analyse complète ---------- */

export function analyserTerrain(d: DonneesTerrain): Analyse {
  const zone = analyserZone(d);
  const voyants: Voyant[] = [
    { cle: "zone", titre: "Urbanisme", niveau: zone.niveau, resume: zone.detail },
    voyantInondation(d),
    voyantCavites(d),
    voyantArgiles(d),
    voyantPatrimoine(d),
  ];
  const doc = d.urbanisme.document;
  const avertissements = [
    "Fiche indicative établie d'après les données publiques du Géoportail de l'urbanisme et de Géorisques : seul un certificat d'urbanisme délivré par la mairie fait foi.",
    doc?.miseEnLigne
      ? `Document d'urbanisme tel que publié sur le Géoportail le ${dateFr(doc.miseEnLigne)} : une modification plus récente peut ne pas y figurer encore.`
      : "Le document d'urbanisme publié sur le Géoportail peut ne pas être la dernière version : vérifiez en mairie.",
    "Les distances aux cavités sont mesurées depuis le centre de la parcelle ; la base nationale des cavités est incomplète.",
  ];
  return {
    zone,
    voyants,
    points: points(d, zone, voyants),
    urbanisme: detailUrbanisme(d, zone),
    risques: detailRisques(d),
    liens: {
      reglement: d.urbanisme.zones[0]?.reglementUrl ?? d.urbanisme.secteursCC[0]?.reglementUrl ?? null,
      geoportail: lienGeoportail(d.parcelle.centre),
      georisques: LIEN_GEORISQUES,
    },
    avertissements,
  };
}

/** Ce que reçoit le navigateur pour l'aperçu : pas le détail complet, réservé au PDF. */
export interface Apercu {
  idu: string;
  reference: string;
  commune: string;
  contenance: number;
  zone: Analyse["zone"];
  voyants: Voyant[];
  /** Nombre de points détaillés dans la fiche complète. */
  points: number;
}

export function apercu(d: DonneesTerrain, a: Analyse): Apercu {
  return {
    idu: d.parcelle.idu,
    reference: `${d.parcelle.section.replace(/^0/, "")} ${d.parcelle.numero}`,
    commune: d.parcelle.commune,
    contenance: d.parcelle.contenance,
    zone: a.zone,
    voyants: a.voyants,
    points: a.points.length,
  };
}

/* ---------- Demande de la fiche complète ---------- */

export interface DemandeFiche {
  idu: string;
  /** Adresse saisie par le visiteur, reprise sur la fiche. */
  adresse: string;
  prenom: string;
  nom: string;
  email: string;
}

export type ErreursFiche = Partial<Record<keyof DemandeFiche | "consentement", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOM_PROPRE = /^[\p{L}][\p{L}\s'’.\-]*$/u;
const IDU = /^(?:\d{2}|2A|2B)\d{3}\d{3}[A-Z0-9]{2}\d{4}$/;
const propre = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const prenomPropre = (p: string) => p.toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());

/** Valide le corps de la demande ; le pot de miel est traité par l'API, avant. */
export function validerDemandeFiche(corps: Record<string, unknown>): { demande: DemandeFiche } | { erreurs: ErreursFiche } {
  const d: DemandeFiche = {
    idu: propre(corps.idu, 14).toUpperCase(),
    adresse: propre(corps.adresse, 160).replace(/[<>]/g, ""),
    prenom: prenomPropre(propre(corps.prenom, 40)),
    nom: propre(corps.nom, 40),
    email: propre(corps.email, 200).toLowerCase(),
  };
  const e: ErreursFiche = {};
  if (!IDU.test(d.idu)) e.idu = "Choisissez votre parcelle sur la carte.";
  if (!d.prenom || !NOM_PROPRE.test(d.prenom)) e.prenom = "Indiquez votre prénom.";
  if (!d.nom || !NOM_PROPRE.test(d.nom)) e.nom = "Indiquez votre nom.";
  if (!EMAIL.test(d.email)) e.email = "Adresse e-mail invalide : c'est là que nous envoyons la fiche.";
  if (corps.consentement !== true) e.consentement = "Merci d'accepter que nous utilisions ces informations.";
  return Object.keys(e).length ? { erreurs: e } : { demande: d };
}
