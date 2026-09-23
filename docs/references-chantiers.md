# Mettre à jour les références chantiers

Page : `/references-chantiers.html` (non liée depuis le site, non indexée).

Tout se passe dans le dossier **`public/references-chantiers/`** :

- `chantiers.json` : la liste des références ;
- `chantier-01.jpg`, `chantier-02.jpg`… : les photos.

Tout se fait depuis github.com, sans rien installer.

## Ajouter une référence

1. **Préparer la photo** : format paysage, environ 800 px de large, moins de 300 Ko
   (par exemple en la redimensionnant sur squoosh.app). Nommez-la sans espace ni accent,
   par exemple `chantier-31.jpg`.
2. **Envoyer la photo** : sur GitHub, ouvrez le dossier `public/references-chantiers`,
   cliquez sur *Add file → Upload files*, déposez la photo, puis *Commit changes*.
3. **Récupérer les coordonnées GPS** : dans Google Maps, faites un clic droit sur
   le chantier, puis cliquez sur la première ligne (par exemple `49.50980, 0.11844`) pour la copier.
4. **Ajouter la référence** : ouvrez `chantiers.json`, cliquez sur le crayon ✏️, et ajoutez
   un bloc avant le `]` final :

   ```json
     {
       "titre": "Maison individuelle à ossature bois",
       "adresse": "12 rue de la Mer",
       "commune": "Octeville-sur-Mer",
       "gps": "49.55512, 0.11873",
       "photo": "chantier-31.jpg"
     }
   ```

   ⚠️ Le bloc précédent doit se terminer par `},` (avec une virgule) ;
   le dernier bloc de la liste se termine par `}` (sans virgule).
5. *Commit changes* : le site se met à jour en quelques minutes.

L'ordre des blocs dans le fichier est l'ordre de la liste sur la page.

## Modifier ou retirer une référence

Dans `chantiers.json`, modifiez le texte entre guillemets, ou supprimez le bloc `{ … }`
(en gardant les virgules correctes). Pour changer une photo, envoyez un nouveau fichier
portant le même nom : il remplace l'ancien.

## En cas d'erreur

Avant chaque mise en ligne, le fichier est vérifié automatiquement (`npm run check:references`) :
virgule manquante, champ vide, photo introuvable, coordonnées hors de la carte.
S'il y a une erreur, la mise en ligne est bloquée, l'ancienne version reste affichée,
et le message d'erreur dans Vercel (onglet *Deployments* → *Build Logs*) indique
quelle référence corriger.

La carte couvre la pointe de Caux (Le Havre et ses environs, entre Étretat et Tancarville).
Un chantier situé en dehors de cette zone est refusé.
