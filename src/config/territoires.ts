/**
 * Régions et départements de France métropolitaine, pour les pages « plans
 * gratuits » locales (/plans-gratuits/<territoire>). Le service de planche
 * gratuite couvre tout terrain cadastré de métropole : une page par région et
 * par département répond aux recherches « plan de masse gratuit Calvados »,
 * « plan cadastral gratuit Seine-Maritime »…
 *
 * Données administratives stables seulement (code, nom, chef-lieu, région) :
 * aucun chiffre inventé. `dans` est la tournure française du lieu (« en
 * Seine-Maritime », « dans le Calvados », « dans l'Eure »), écrite à la main :
 * aucune règle ne la déduit du nom.
 */

export interface Region {
  slug: string;
  nom: string;
  dans: string;
  /** « de Normandie », « du Grand Est », « d'Occitanie ». */
  de: string;
  /** Chef-lieu de région. */
  chefLieu: string;
}

export interface DepartementFr {
  code: string;
  nom: string;
  dans: string;
  /** Préfecture. */
  prefecture: string;
  region: string;
}

export const TERRITOIRES_LAST_MODIFIED = "2026-11-02";

export const regions: Region[] = [
  { slug: "auvergne-rhone-alpes", nom: "Auvergne-Rhône-Alpes", dans: "en Auvergne-Rhône-Alpes", de: "d'Auvergne-Rhône-Alpes", chefLieu: "Lyon" },
  { slug: "bourgogne-franche-comte", nom: "Bourgogne-Franche-Comté", dans: "en Bourgogne-Franche-Comté", de: "de Bourgogne-Franche-Comté", chefLieu: "Dijon" },
  { slug: "bretagne", nom: "Bretagne", dans: "en Bretagne", de: "de Bretagne", chefLieu: "Rennes" },
  { slug: "centre-val-de-loire", nom: "Centre-Val de Loire", dans: "en Centre-Val de Loire", de: "du Centre-Val de Loire", chefLieu: "Orléans" },
  { slug: "corse", nom: "Corse", dans: "en Corse", de: "de Corse", chefLieu: "Ajaccio" },
  { slug: "grand-est", nom: "Grand Est", dans: "dans le Grand Est", de: "du Grand Est", chefLieu: "Strasbourg" },
  { slug: "hauts-de-france", nom: "Hauts-de-France", dans: "dans les Hauts-de-France", de: "des Hauts-de-France", chefLieu: "Lille" },
  { slug: "ile-de-france", nom: "Île-de-France", dans: "en Île-de-France", de: "d'Île-de-France", chefLieu: "Paris" },
  { slug: "normandie", nom: "Normandie", dans: "en Normandie", de: "de Normandie", chefLieu: "Rouen" },
  { slug: "nouvelle-aquitaine", nom: "Nouvelle-Aquitaine", dans: "en Nouvelle-Aquitaine", de: "de Nouvelle-Aquitaine", chefLieu: "Bordeaux" },
  { slug: "occitanie", nom: "Occitanie", dans: "en Occitanie", de: "d'Occitanie", chefLieu: "Toulouse" },
  { slug: "pays-de-la-loire", nom: "Pays de la Loire", dans: "dans les Pays de la Loire", de: "des Pays de la Loire", chefLieu: "Nantes" },
  { slug: "provence-alpes-cote-d-azur", nom: "Provence-Alpes-Côte d'Azur", dans: "en Provence-Alpes-Côte d'Azur", de: "de Provence-Alpes-Côte d'Azur", chefLieu: "Marseille" },
];

const d = (code: string, nom: string, dans: string, prefecture: string, region: string): DepartementFr => ({
  code,
  nom,
  dans,
  prefecture,
  region,
});

export const departementsFr: DepartementFr[] = [
  d("01", "Ain", "dans l'Ain", "Bourg-en-Bresse", "auvergne-rhone-alpes"),
  d("02", "Aisne", "dans l'Aisne", "Laon", "hauts-de-france"),
  d("03", "Allier", "dans l'Allier", "Moulins", "auvergne-rhone-alpes"),
  d("04", "Alpes-de-Haute-Provence", "dans les Alpes-de-Haute-Provence", "Digne-les-Bains", "provence-alpes-cote-d-azur"),
  d("05", "Hautes-Alpes", "dans les Hautes-Alpes", "Gap", "provence-alpes-cote-d-azur"),
  d("06", "Alpes-Maritimes", "dans les Alpes-Maritimes", "Nice", "provence-alpes-cote-d-azur"),
  d("07", "Ardèche", "en Ardèche", "Privas", "auvergne-rhone-alpes"),
  d("08", "Ardennes", "dans les Ardennes", "Charleville-Mézières", "grand-est"),
  d("09", "Ariège", "en Ariège", "Foix", "occitanie"),
  d("10", "Aube", "dans l'Aube", "Troyes", "grand-est"),
  d("11", "Aude", "dans l'Aude", "Carcassonne", "occitanie"),
  d("12", "Aveyron", "en Aveyron", "Rodez", "occitanie"),
  d("13", "Bouches-du-Rhône", "dans les Bouches-du-Rhône", "Marseille", "provence-alpes-cote-d-azur"),
  d("14", "Calvados", "dans le Calvados", "Caen", "normandie"),
  d("15", "Cantal", "dans le Cantal", "Aurillac", "auvergne-rhone-alpes"),
  d("16", "Charente", "en Charente", "Angoulême", "nouvelle-aquitaine"),
  d("17", "Charente-Maritime", "en Charente-Maritime", "La Rochelle", "nouvelle-aquitaine"),
  d("18", "Cher", "dans le Cher", "Bourges", "centre-val-de-loire"),
  d("19", "Corrèze", "en Corrèze", "Tulle", "nouvelle-aquitaine"),
  d("2A", "Corse-du-Sud", "en Corse-du-Sud", "Ajaccio", "corse"),
  d("2B", "Haute-Corse", "en Haute-Corse", "Bastia", "corse"),
  d("21", "Côte-d'Or", "en Côte-d'Or", "Dijon", "bourgogne-franche-comte"),
  d("22", "Côtes-d'Armor", "dans les Côtes-d'Armor", "Saint-Brieuc", "bretagne"),
  d("23", "Creuse", "en Creuse", "Guéret", "nouvelle-aquitaine"),
  d("24", "Dordogne", "en Dordogne", "Périgueux", "nouvelle-aquitaine"),
  d("25", "Doubs", "dans le Doubs", "Besançon", "bourgogne-franche-comte"),
  d("26", "Drôme", "dans la Drôme", "Valence", "auvergne-rhone-alpes"),
  d("27", "Eure", "dans l'Eure", "Évreux", "normandie"),
  d("28", "Eure-et-Loir", "en Eure-et-Loir", "Chartres", "centre-val-de-loire"),
  d("29", "Finistère", "dans le Finistère", "Quimper", "bretagne"),
  d("30", "Gard", "dans le Gard", "Nîmes", "occitanie"),
  d("31", "Haute-Garonne", "en Haute-Garonne", "Toulouse", "occitanie"),
  d("32", "Gers", "dans le Gers", "Auch", "occitanie"),
  d("33", "Gironde", "en Gironde", "Bordeaux", "nouvelle-aquitaine"),
  d("34", "Hérault", "dans l'Hérault", "Montpellier", "occitanie"),
  d("35", "Ille-et-Vilaine", "en Ille-et-Vilaine", "Rennes", "bretagne"),
  d("36", "Indre", "dans l'Indre", "Châteauroux", "centre-val-de-loire"),
  d("37", "Indre-et-Loire", "en Indre-et-Loire", "Tours", "centre-val-de-loire"),
  d("38", "Isère", "en Isère", "Grenoble", "auvergne-rhone-alpes"),
  d("39", "Jura", "dans le Jura", "Lons-le-Saunier", "bourgogne-franche-comte"),
  d("40", "Landes", "dans les Landes", "Mont-de-Marsan", "nouvelle-aquitaine"),
  d("41", "Loir-et-Cher", "dans le Loir-et-Cher", "Blois", "centre-val-de-loire"),
  d("42", "Loire", "dans la Loire", "Saint-Étienne", "auvergne-rhone-alpes"),
  d("43", "Haute-Loire", "en Haute-Loire", "Le Puy-en-Velay", "auvergne-rhone-alpes"),
  d("44", "Loire-Atlantique", "en Loire-Atlantique", "Nantes", "pays-de-la-loire"),
  d("45", "Loiret", "dans le Loiret", "Orléans", "centre-val-de-loire"),
  d("46", "Lot", "dans le Lot", "Cahors", "occitanie"),
  d("47", "Lot-et-Garonne", "dans le Lot-et-Garonne", "Agen", "nouvelle-aquitaine"),
  d("48", "Lozère", "en Lozère", "Mende", "occitanie"),
  d("49", "Maine-et-Loire", "en Maine-et-Loire", "Angers", "pays-de-la-loire"),
  d("50", "Manche", "dans la Manche", "Saint-Lô", "normandie"),
  d("51", "Marne", "dans la Marne", "Châlons-en-Champagne", "grand-est"),
  d("52", "Haute-Marne", "en Haute-Marne", "Chaumont", "grand-est"),
  d("53", "Mayenne", "en Mayenne", "Laval", "pays-de-la-loire"),
  d("54", "Meurthe-et-Moselle", "en Meurthe-et-Moselle", "Nancy", "grand-est"),
  d("55", "Meuse", "dans la Meuse", "Bar-le-Duc", "grand-est"),
  d("56", "Morbihan", "dans le Morbihan", "Vannes", "bretagne"),
  d("57", "Moselle", "en Moselle", "Metz", "grand-est"),
  d("58", "Nièvre", "dans la Nièvre", "Nevers", "bourgogne-franche-comte"),
  d("59", "Nord", "dans le Nord", "Lille", "hauts-de-france"),
  d("60", "Oise", "dans l'Oise", "Beauvais", "hauts-de-france"),
  d("61", "Orne", "dans l'Orne", "Alençon", "normandie"),
  d("62", "Pas-de-Calais", "dans le Pas-de-Calais", "Arras", "hauts-de-france"),
  d("63", "Puy-de-Dôme", "dans le Puy-de-Dôme", "Clermont-Ferrand", "auvergne-rhone-alpes"),
  d("64", "Pyrénées-Atlantiques", "dans les Pyrénées-Atlantiques", "Pau", "nouvelle-aquitaine"),
  d("65", "Hautes-Pyrénées", "dans les Hautes-Pyrénées", "Tarbes", "occitanie"),
  d("66", "Pyrénées-Orientales", "dans les Pyrénées-Orientales", "Perpignan", "occitanie"),
  d("67", "Bas-Rhin", "dans le Bas-Rhin", "Strasbourg", "grand-est"),
  d("68", "Haut-Rhin", "dans le Haut-Rhin", "Colmar", "grand-est"),
  d("69", "Rhône", "dans le Rhône", "Lyon", "auvergne-rhone-alpes"),
  d("70", "Haute-Saône", "en Haute-Saône", "Vesoul", "bourgogne-franche-comte"),
  d("71", "Saône-et-Loire", "en Saône-et-Loire", "Mâcon", "bourgogne-franche-comte"),
  d("72", "Sarthe", "dans la Sarthe", "Le Mans", "pays-de-la-loire"),
  d("73", "Savoie", "en Savoie", "Chambéry", "auvergne-rhone-alpes"),
  d("74", "Haute-Savoie", "en Haute-Savoie", "Annecy", "auvergne-rhone-alpes"),
  d("75", "Paris", "à Paris", "Paris", "ile-de-france"),
  d("76", "Seine-Maritime", "en Seine-Maritime", "Rouen", "normandie"),
  d("77", "Seine-et-Marne", "en Seine-et-Marne", "Melun", "ile-de-france"),
  d("78", "Yvelines", "dans les Yvelines", "Versailles", "ile-de-france"),
  d("79", "Deux-Sèvres", "dans les Deux-Sèvres", "Niort", "nouvelle-aquitaine"),
  d("80", "Somme", "dans la Somme", "Amiens", "hauts-de-france"),
  d("81", "Tarn", "dans le Tarn", "Albi", "occitanie"),
  d("82", "Tarn-et-Garonne", "dans le Tarn-et-Garonne", "Montauban", "occitanie"),
  d("83", "Var", "dans le Var", "Toulon", "provence-alpes-cote-d-azur"),
  d("84", "Vaucluse", "dans le Vaucluse", "Avignon", "provence-alpes-cote-d-azur"),
  d("85", "Vendée", "en Vendée", "La Roche-sur-Yon", "pays-de-la-loire"),
  d("86", "Vienne", "dans la Vienne", "Poitiers", "nouvelle-aquitaine"),
  d("87", "Haute-Vienne", "en Haute-Vienne", "Limoges", "nouvelle-aquitaine"),
  d("88", "Vosges", "dans les Vosges", "Épinal", "grand-est"),
  d("89", "Yonne", "dans l'Yonne", "Auxerre", "bourgogne-franche-comte"),
  d("90", "Territoire de Belfort", "dans le Territoire de Belfort", "Belfort", "bourgogne-franche-comte"),
  d("91", "Essonne", "dans l'Essonne", "Évry-Courcouronnes", "ile-de-france"),
  d("92", "Hauts-de-Seine", "dans les Hauts-de-Seine", "Nanterre", "ile-de-france"),
  d("93", "Seine-Saint-Denis", "en Seine-Saint-Denis", "Bobigny", "ile-de-france"),
  d("94", "Val-de-Marne", "dans le Val-de-Marne", "Créteil", "ile-de-france"),
  d("95", "Val-d'Oise", "dans le Val-d'Oise", "Cergy", "ile-de-france"),
];
