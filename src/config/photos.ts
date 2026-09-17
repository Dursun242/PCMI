/**
 * Photos de maisons haut de gamme (licence Unsplash : usage commercial libre,
 * crédit apprécié mais non obligatoire).
 *
 * Les fichiers sont téléchargés dans public/photos/ par `npm run photos`.
 * Pour remplacer par vos propres réalisations : déposez vos JPEG dans
 * public/photos/ et décrivez-les ici (credit facultatif).
 */
export interface Photo {
  file: string; // nom du fichier dans public/photos/
  alt: string;
  caption: string;
  credit?: { name: string; url: string };
  source?: string; // URL de téléchargement (Unsplash) — utilisée par le script
  wide?: boolean; // occupe deux colonnes dans la galerie
}

const u = (id: string) => `https://images.unsplash.com/${id}?fm=jpg&q=82&w=2000&auto=format&fit=crop`;

export const photos: Photo[] = [
  {
    file: "maison-le-touquet.jpg",
    alt: "Maison contemporaine blanche à toit plat au Touquet-Paris-Plage, sous un ciel bleu",
    caption: "Le Touquet-Paris-Plage, Pas-de-Calais",
    credit: { name: "Felix", url: "https://unsplash.com/@felifox" },
    source: u("photo-1628012209120-d9db7abf7eab"),
    wide: true,
  },
  {
    file: "maison-bois-beton.jpg",
    alt: "Maison d'architecte en béton blanc et bardage bois, avec piscine",
    caption: "Béton blanc et bardage bois",
    credit: { name: "Ярослав Алексеенко", url: "https://unsplash.com/@webaliser" },
    source: u("photo-1580587771525-78b9dba3b914"),
  },
  {
    file: "maison-zwolle.jpg",
    alt: "Maison contemporaine blanche aux volumes géométriques à Zwolle, Pays-Bas",
    caption: "Zwolle, Pays-Bas",
    credit: { name: "Peter Jan Rijpkema", url: "https://unsplash.com/@pjrijpkema" },
    source: u("photo-1564703048291-bcf7f001d83d"),
  },
  {
    file: "villa-mediterranee.jpg",
    alt: "Villa moderne blanche avec piscine sous un ciel bleu, Espagne",
    caption: "Villa contemporaine, Andalousie",
    credit: { name: "Frames For Your Heart", url: "https://unsplash.com/@framesforyourheart" },
    source: u("photo-1600596542815-ffad4c1539a9"),
  },
  {
    file: "maison-minimaliste.jpg",
    alt: "Maison minimaliste en béton blanc entourée de verdure",
    caption: "Volumes simples, jardin dessiné",
    credit: { name: "Pixasquare", url: "https://unsplash.com/@pixasquare" },
    source: u("photo-1523217582562-09d0def993a6"),
  },
  {
    file: "maison-amsterdam.jpg",
    alt: "Façade blanche et menuiseries bois d'une maison contemporaine à Amsterdam",
    caption: "Amsterdam, Pays-Bas",
    credit: { name: "Andre Morales Kalamar", url: "https://unsplash.com/@andre___mk" },
    source: u("photo-1691425700585-c108acad6467"),
    wide: true,
  },
];
