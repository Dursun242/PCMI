# Permis by ID Maîtrise

Site dédié à l'offre « permis de construire de maison individuelle » d'ID Maîtrise.
Next.js 15 (App Router), Tailwind 4, Cormorant Garamond + Lato auto-hébergées, Resend pour les e-mails, prêt pour Vercel.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner RESEND_API_KEY
npm run dev                  # http://localhost:3000
```

Sans `RESEND_API_KEY`, le formulaire répond « envoyé » mais n'expédie rien (la demande est loguée côté serveur).

## Où modifier quoi

| Je veux changer…                         | Fichier                                   |
| ---------------------------------------- | ----------------------------------------- |
| Prix, formules, options, FAQ, chiffres   | `src/config/site.ts`                      |
| Coordonnées, SIREN, assurance, hébergeur | `src/config/site.ts` (bloc `legal`)       |
| Textes de la page d'accueil              | `src/app/page.tsx`                        |
| Page tarifs (tableau comparatif)         | `src/app/tarifs/page.tsx`                 |
| Guide SEO du permis                      | `src/app/permis-de-construire-maison/page.tsx` |
| Formulaire de devis                      | `src/components/DevisForm.tsx`            |
| E-mails envoyés (interne + client)       | `src/app/api/devis/route.ts`              |
| Couleurs, polices, boutons               | `src/app/globals.css` (bloc `@theme`)     |
| Dessin de la façade du hero              | `src/components/HouseDrawing.tsx`         |

## Déployer sur Vercel

1. Pousser le dépôt sur GitHub.
2. Vercel → New Project → importer le dépôt (préréglage Next.js détecté automatiquement).
3. Variables d'environnement : `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`, `NEXT_PUBLIC_SITE_URL`.
4. Domaine : ajouter `permis-maison-individuelle.fr` dans Vercel (Project → Settings → Domains), puis chez Hostinger (hPanel → Domaines → DNS / Zone DNS) :
   - `A` `@` → `76.76.21.21`
   - `CNAME` `www` → `cname.vercel-dns.com`
   Vercel indique aussi ces valeurs (et le statut de vérification) sur la page du domaine une fois ajouté.
5. Dans Resend, le domaine `id-maitrise.com` doit être vérifié (SPF + DKIM) pour que `contact@id-maitrise.com` puisse expédier.

## SEO déjà en place

- Métadonnées par page, canoniques, Open Graph.
- JSON-LD : `ProfessionalService` avec les trois offres, `FAQPage`, `Article` (guide), fils d'Ariane.
- `sitemap.xml` et `robots.txt` générés (`src/app/sitemap.ts`, `src/app/robots.ts`).
- Page pilier « permis de construire maison individuelle » ciblant les requêtes nationales.

## Espace admin

Une page `/admin` protégée par mot de passe permet d'éditer articles, chiffres clés et réalisations sans toucher au code (formulaires, pas de Git ni de terminal requis).

1. Variable d'environnement obligatoire : `ADMIN_PASSWORD` (le mot de passe de connexion à `/admin`).
2. Pour que les modifications soient enregistrées **en production sur Vercel** (le système de fichiers y est en lecture seule), ajoutez aussi :
   - `ADMIN_GITHUB_TOKEN` : un [personal access token GitHub](https://github.com/settings/tokens) (fine-grained, droit **Contents: Read and write** sur ce dépôt uniquement).
   - `ADMIN_GITHUB_REPO` : `dursun242/pcmi` (propriétaire/dépôt).
   - `ADMIN_GITHUB_BRANCH` : facultatif, `main` par défaut.

   Chaque enregistrement dans `/admin` crée alors un commit sur ce dépôt ; Vercel redéploie automatiquement (30 s à 1 min).

Sans `ADMIN_GITHUB_TOKEN`/`ADMIN_GITHUB_REPO`, `/admin` reste utilisable **en local** (`npm run dev`) : les modifications sont écrites directement sur le disque, pratique pour tester avant de configurer GitHub.

Ce que `/admin` permet aujourd'hui : créer/modifier/supprimer les articles de `/conseils` (avec envoi direct de l'image depuis l'ordinateur, jpg/png/webp/svg, 4 Mo max — stockée dans `public/uploads/`), éditer les chiffres clés de l'accueil, gérer la liste des réalisations. Pour le reste (prix, FAQ, textes des pages), on continue de modifier le code comme indiqué ci-dessus.

## Photos

La galerie de la page d'accueil (`src/components/Gallery.tsx`) affiche les photos listées dans `src/config/photos.ts` et présentes dans `public/photos/`.

- `npm run photos` télécharge les six photos Unsplash sélectionnées (licence libre, usage commercial autorisé). Ce script tourne aussi automatiquement avant chaque `npm run build`, donc sur Vercel.
- Pour vos propres réalisations : déposez vos JPEG dans `public/photos/` et décrivez-les dans `src/config/photos.ts` (le champ `credit` est facultatif). Les photos absentes sont simplement ignorées ; sans aucune photo, la section n'apparaît pas.

## Prix

Les prix sont saisis et affichés TTC (`priceTTC` dans `src/config/site.ts`) ; le montant HT est calculé automatiquement (`ht()`), TVA 20 %.

## Moteur SEO autonome

Chaque lundi, le workflow GitHub Actions `.github/workflows/seo-weekly.yml` :

1. **Analyse** (`scripts/seo/analyze.mjs`) : lit Search Console (28 jours), repère les requêtes à fort volume mal positionnées et sans page dédiée, les pages bien classées mais peu cliquées, et les articles qui perdent des places. Sans Search Console (site neuf), il travaille à partir de `seo/seed-keywords.json`. Rapport dans `seo/report.md`.
2. **Rédaction** (`scripts/seo/generate.mjs`) : écrit un article MDX dans `content/articles/` sur le meilleur sujet, avec l'API Anthropic, contraint par une fiche de faits réglementaires (seuils, délais, prix) pour ne rien inventer. Les articles paraissent sur `/conseils`.
3. **Balises** (`scripts/seo/optimize.mjs`) : pour les pages au CTR trop bas, propose un nouveau titre et une nouvelle description, écrits dans `seo/meta-overrides.json` et appliqués au build via `src/lib/seo.ts`. Une surcharge est conservée six semaines avant d'être réévaluée.
4. **Build de vérification, commit, push** → Vercel redéploie. **IndexNow** notifie Bing et consorts des URL modifiées ; Google suit via `sitemap.xml`.

À configurer dans GitHub → Settings → Secrets and variables → Actions :

| Type | Nom | Valeur |
|---|---|---|
| Secret | `ANTHROPIC_API_KEY` | clé API Anthropic |
| Secret | `GSC_SERVICE_ACCOUNT_JSON` | JSON du compte de service Google, ajouté comme utilisateur (lecture) de la propriété Search Console |
| Secret | `INDEXNOW_KEY` | 32 caractères hexadécimaux au choix ; le même dans les variables Vercel |
| Variable | `GSC_PROPERTY` | `sc-domain:permis-maison-individuelle.fr` (ou `https://permis-maison-individuelle.fr/`) |
| Variable | `NEXT_PUBLIC_SITE_URL` | `https://permis-maison-individuelle.fr` |
| Variable | `SEO_MODEL` | facultatif, `claude-sonnet-4-5` par défaut |

En local : `npm run seo:analyze` (rapport), `npm run seo:article -- --query "…"` (forcer un sujet), `npm run seo:article -- --refresh <slug>` (réécrire un article), `npm run seo` (cycle complet). Le workflow se lance aussi à la main depuis l'onglet Actions, avec un sujet imposé si besoin.

Pour écrire un article à la main : un fichier `content/articles/<slug>.mdx` avec `title`, `description`, `date`, `keywords` en frontmatter suffit.

## Formulaires

| Page | Rôle | Route API |
|---|---|---|
| `/devis` | Demande de devis rapide (3 minutes) | `/api/devis` |
| `/contact` | Contact simple avec pièces jointes | `/api/contact` |
| `/dossier` | Fiche projet complète en 6 étapes, calquée sur le CERFA 13406 (`src/config/dossier.ts`), avec pièces jointes | `/api/dossier` |

Chaque envoi produit un e-mail interne détaillé + un accusé de réception au client. La fiche projet joint en plus un `dossier.json` structuré (toutes les réponses, surface de plancher totale, drapeau architecte), réutilisable par l'outil de génération PCMI.

Pièces jointes : téléversement direct navigateur → Vercel Blob (`BLOB_READ_WRITE_TOKEN`, 25 Mo par fichier), les e-mails contiennent les liens. Sans jeton, les fichiers partent en pièce jointe directe, 3,5 Mo au total (limite des fonctions Vercel).
