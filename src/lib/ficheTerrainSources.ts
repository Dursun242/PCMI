import "server-only";
import type { Cavite, DonneesTerrain, Mention, Servitude, ZoneUrba } from "@/lib/ficheTerrain";
import { estIdu } from "@/lib/planche";

/**
 * Chargement des données publiques d'une parcelle, directement depuis le site :
 * cadastre et Géoportail de l'urbanisme (API Carto de l'IGN), risques
 * (Géorisques). Une quinzaine d'appels lancés en même temps, ≈ 1 à 2 s.
 * Aucun stockage, aucun appel à GitHub.
 *
 * Une source qui ne répond pas n'empêche pas la fiche : sa partie est marquée
 * « indisponible » et l'analyse le dit.
 */

const CARTO = "https://apicarto.ign.fr/api";
const GR = "https://georisques.gouv.fr/api/v1";
const DELAI_MS = 8000;
const RAYON_RISQUES_M = 500;

type Json = Record<string, unknown>;
type Feature = { properties?: Json; geometry?: { type: string; coordinates: unknown } };

async function lire(url: string, params: Record<string, string>): Promise<Json> {
  const u = `${url}?${new URLSearchParams(params)}`;
  for (let essai = 0; essai < 2; essai += 1) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(DELAI_MS), headers: { Accept: "application/json" } });
      if (r.ok) return (await r.json()) as Json;
      if (r.status < 500) throw new Error(`HTTP ${r.status}`);
    } catch (err) {
      if (essai === 1) throw err;
    }
  }
  throw new Error(`${url} : pas de réponse`);
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const features = (j: Json) => (Array.isArray(j.features) ? (j.features as Feature[]) : []);
const props = (j: Json) => features(j).map((f) => f.properties ?? {});
const donnees = (j: Json) => (Array.isArray(j.data) ? (j.data as Json[]) : []);

function anneaux(g: Feature["geometry"]): [number, number][][] {
  if (!g) return [];
  const polys = (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []) as number[][][][];
  return polys.map((p) => p[0].map(([lon, lat]) => [lon, lat] as [number, number]));
}

function centreDe(contours: [number, number][][]): [number, number] {
  const pts = contours.flat();
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
}

function distance([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const mLat = 111_195;
  const mLon = mLat * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot((lon2 - lon1) * mLon, (lat2 - lat1) * mLat);
}

/** Lien direct vers le règlement écrit publié sur le Géoportail (nomfic « fichier.pdf#page=116 »). */
export function urlReglement(p: Json): string | null {
  const nomfic = s(p.nomfic);
  const partition = s(p.partition);
  const doc = s(p.gpu_doc_id);
  if (nomfic && partition && doc && /\.pdf/i.test(nomfic)) {
    const [fichier, ancre] = nomfic.split("#");
    return `https://data.geopf.fr/annexes/gpu/documents/${encodeURIComponent(partition)}/${doc}/${encodeURIComponent(fichier)}${ancre ? `#${ancre}` : ""}`;
  }
  const url = s(p.urlfic);
  return /^https?:\/\//.test(url) ? url : null;
}

async function parcelle(idu: string) {
  const j = await lire(`${CARTO}/cadastre/parcelle`, {
    code_insee: idu.slice(0, 5),
    com_abs: idu.slice(5, 8),
    section: idu.slice(8, 10),
    numero: idu.slice(10, 14),
  });
  const f = features(j)[0];
  if (!f) return null;
  const p = f.properties ?? {};
  const contours = anneaux(f.geometry);
  if (!contours.length) return null;
  return {
    idu,
    section: s(p.section),
    numero: s(p.numero),
    commune: s(p.nom_com),
    codeInsee: s(p.code_insee) || idu.slice(0, 5),
    contenance: Number(p.contenance) || 0,
    contours,
    centre: centreDe(contours),
    geometrie: f.geometry,
  };
}

async function urbanisme(geom: string, insee: string): Promise<DonneesTerrain["urbanisme"]> {
  const appel = (k: string) => lire(`${CARTO}/gpu/${k}`, { geom });
  const [zones, docs, cc, psurf, plin, ppct, info, supS, supL, supP, commune] = await Promise.all([
    appel("zone-urba"),
    appel("document"),
    appel("secteur-cc"),
    appel("prescription-surf"),
    appel("prescription-lin"),
    appel("prescription-pct"),
    appel("info-surf"),
    appel("assiette-sup-s"),
    appel("assiette-sup-l"),
    appel("assiette-sup-p"),
    lire(`${CARTO}/gpu/municipality`, { insee }),
  ]);
  const mention = (p: Json): Mention => ({ libelle: s(p.libelle), txt: s(p.txt) });
  const unique = <T>(l: T[], cle: (x: T) => string) => [...new Map(l.map((x) => [cle(x), x])).values()];
  const zoneProps = props(zones);
  const doc = props(docs)[0];
  const z0 = zoneProps[0] ?? props(cc)[0];
  return {
    etat: "ok",
    rnu: props(commune)[0] ? Boolean(props(commune)[0].is_rnu) : null,
    document: doc
      ? {
          type: s(doc.du_type),
          nom: s(doc.grid_title) && s(doc.grid_title).toUpperCase() !== s(doc.du_type).toUpperCase() ? s(doc.grid_title) : "",
          date: s(z0?.datvalid) || s(z0?.datappro) || null,
          miseEnLigne: s(doc.gpu_timestamp) || null,
        }
      : null,
    zones: zoneProps.map(
      (p): ZoneUrba => ({ libelle: s(p.libelle), libelong: s(p.libelong), typezone: s(p.typezone), reglementUrl: urlReglement(p) }),
    ),
    secteursCC: props(cc).map((p) => ({ libelle: s(p.libelle), typesect: s(p.typesect), reglementUrl: urlReglement(p) })),
    prescriptions: unique([...props(psurf), ...props(plin), ...props(ppct)].map(mention), (m) => `${m.libelle}|${m.txt}`),
    informations: unique(props(info).map(mention), (m) => `${m.libelle}|${m.txt}`),
    servitudes: unique(
      [...props(supS), ...props(supL), ...props(supP)].map((p): Servitude => ({ type: s(p.suptype).toLowerCase(), nom: s(p.nomsuplitt) })),
      (x) => `${x.type}|${x.nom}`,
    ),
  };
}

async function risques(centre: [number, number], insee: string): Promise<DonneesTerrain["risques"]> {
  const latlon = `${centre[0].toFixed(6)},${centre[1].toFixed(6)}`;
  const rayon = { latlon, rayon: String(RAYON_RISQUES_M), page_size: "100" };
  const [rga, cav, mvt, sism, radon, gaspar] = await Promise.allSettled([
    lire(`${GR}/rga`, { latlon }),
    lire(`${GR}/cavites`, rayon),
    lire(`${GR}/mvt`, rayon),
    lire(`${GR}/zonage_sismique`, { code_insee: insee }),
    lire(`${GR}/radon`, { code_insee: insee }),
    lire(`${GR}/gaspar/risques`, { code_insee: insee }),
  ]);
  const ok = <T>(r: PromiseSettledResult<Json>, f: (j: Json) => T): T | null => (r.status === "fulfilled" ? f(r.value) : null);
  const points = (j: Json): Cavite[] =>
    donnees(j)
      .filter((x) => typeof x.longitude === "number" && typeof x.latitude === "number")
      .map((x) => ({
        type: s(x.type) || s(x.type_mvt) || s(x.libelle_type),
        nom: s(x.nom) || s(x.identifiant),
        distance: Math.round(distance(centre, [x.longitude as number, x.latitude as number])),
      }))
      .filter((c) => c.distance <= RAYON_RISQUES_M)
      .sort((a, b) => a.distance - b.distance);
  const resultats = [rga, cav, mvt, sism, radon, gaspar];
  return {
    etat: resultats.every((r) => r.status === "rejected") ? "indisponible" : "ok",
    argiles: ok(rga, (j) => (j.codeExposition !== undefined ? Number(j.codeExposition) : null)),
    cavites: ok(cav, points),
    mouvements: ok(mvt, points),
    sismicite: ok(sism, (j) => Number(donnees(j)[0]?.code_zone) || null),
    radon: ok(radon, (j) => Number(donnees(j)[0]?.classe_potentiel) || null),
    commune: ok(gaspar, (j) =>
      donnees(j).flatMap((r) => (Array.isArray(r.risques_detail) ? (r.risques_detail as Json[]).map((x) => s(x.libelle_risque_long)) : [])),
    ),
  };
}

/** Données publiques d'une parcelle ; null si la parcelle est introuvable. */
export async function chargerTerrain(idu: string, adresse: string | null = null): Promise<DonneesTerrain | null> {
  if (!estIdu(idu)) return null;
  const p = await parcelle(idu);
  if (!p) return null;
  const geom = JSON.stringify(p.geometrie);
  const [u, r] = await Promise.allSettled([urbanisme(geom, p.codeInsee), risques(p.centre, p.codeInsee)]);
  const { geometrie: _g, ...parcelleSansGeom } = p;
  void _g;
  return {
    parcelle: parcelleSansGeom,
    adresse,
    urbanisme:
      u.status === "fulfilled"
        ? u.value
        : { etat: "indisponible", rnu: null, document: null, zones: [], secteursCC: [], prescriptions: [], informations: [], servitudes: [] },
    risques:
      r.status === "fulfilled"
        ? r.value
        : { etat: "indisponible", argiles: null, cavites: null, mouvements: null, sismicite: null, radon: null, commune: null },
  };
}
