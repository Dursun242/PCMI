import "server-only";
import { distanceAuContour, type ParcelleCandidate, type RechercheTerrain } from "@/lib/planche";

/**
 * Recherche du terrain pour la planche gratuite : géocodage de l'adresse
 * (Géoplateforme IGN), puis parcelles cadastrales autour du point (API Carto).
 * Le point d'une adresse tombe souvent sur la voirie : on renvoie donc les
 * parcelles proches, et le visiteur confirme la sienne sur la carte.
 */

const GEOCODAGE = "https://data.geopf.fr/geocodage/search";
const CADASTRE = "https://apicarto.ign.fr/api/cadastre/parcelle";
/** Rayon de recherche autour du point de l'adresse, en mètres. */
const RAYON_M = 45;
const PARCELLES_MAX = 14;
const DELAI_MS = 9000;

interface FeatureGeocodage {
  geometry: { coordinates: [number, number] };
  properties: { label: string; name?: string; postcode?: string; city?: string; type?: string; score?: number };
}

interface FeatureParcelle {
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
  properties: { idu: string; section: string; numero: string; nom_com: string; code_insee: string; contenance: number };
}

async function lireJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { signal: AbortSignal.timeout(DELAI_MS), headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${new URL(url).host} : HTTP ${r.status}`);
  return (await r.json()) as T;
}

/** Anneaux extérieurs d'un Polygon ou d'un MultiPolygon GeoJSON. */
function anneauxExterieurs(g: FeatureParcelle["geometry"]): [number, number][][] {
  const polygones = (g.type === "Polygon" ? [g.coordinates] : g.coordinates) as number[][][][];
  return polygones.map((p) => p[0].map(([lon, lat]) => [lon, lat] as [number, number]));
}

/** Carré de 2 × rayon autour du point, en GeoJSON. */
function carre([lon, lat]: [number, number], rayonM: number) {
  const dLat = rayonM / 111_195;
  const dLon = rayonM / (111_195 * Math.cos((lat * Math.PI) / 180));
  const [o, s, e, n] = [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
  return { type: "Polygon", coordinates: [[[o, s], [e, s], [e, n], [o, n], [o, s]]] };
}

export async function rechercherTerrain(q: string): Promise<RechercheTerrain | null> {
  const geo = await lireJson<{ features: FeatureGeocodage[] }>(
    `${GEOCODAGE}?${new URLSearchParams({ q, limit: "1", index: "address" })}`,
  );
  const a = geo.features[0];
  if (!a) return null;
  const point = a.geometry.coordinates;
  const cad = await lireJson<{ features: FeatureParcelle[] }>(
    `${CADASTRE}?${new URLSearchParams({ geom: JSON.stringify(carre(point, RAYON_M)), _limit: "60" })}`,
  );
  const parcelles: ParcelleCandidate[] = cad.features
    .map((f) => {
      const contours = anneauxExterieurs(f.geometry);
      return {
        idu: f.properties.idu,
        section: f.properties.section,
        numero: f.properties.numero,
        commune: f.properties.nom_com,
        codeInsee: f.properties.code_insee,
        contenance: f.properties.contenance,
        contours,
        distance: Math.round(distanceAuContour(point, contours) * 10) / 10,
      };
    })
    .filter((p) => p.distance <= RAYON_M)
    .sort((x, y) => x.distance - y.distance)
    .slice(0, PARCELLES_MAX);
  const p = a.properties;
  return {
    adresse: {
      label: p.label,
      voie: p.name ?? p.label,
      ville: [p.postcode, p.city].filter(Boolean).join(" "),
      lon: point[0],
      lat: point[1],
    },
    parcelles,
  };
}
