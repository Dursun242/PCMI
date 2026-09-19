# Liens marqués — savoir d'où viennent les visiteurs

## Le problème que ça règle

Instagram, LinkedIn et la fiche Google envoient du monde sur le site, mais
l'onglet **Referrers** de Vercel Web Analytics reste vide. Ce n'est pas un bug :
le navigateur intégré d'Instagram et les applications mobiles ne transmettent
pas de référent. Ces visiteurs sont donc comptés en « direct », mélangés à ceux
qui tapent l'adresse ou reviennent par un marque-page.

La solution ne dépend d'aucun plan payant : on marque le lien à la source, avec
des paramètres `utm_*` que Vercel lit dans son onglet **UTM Parameters**.

## La nomenclature

Trois paramètres, et on s'y tient. Une nomenclature incohérente produit des
statistiques illisibles au bout de trois mois.

| Paramètre | Ce qu'il dit | Valeurs utilisées |
|---|---|---|
| `utm_source` | D'où vient le clic | `instagram`, `linkedin`, `google` |
| `utm_medium` | Où était le lien | `bio`, `profil`, `fiche`, `story`, `post` |
| `utm_campaign` | Opération ponctuelle | facultatif, en minuscules sans accent |

Règles : **toujours en minuscules**, **jamais d'accent ni d'espace**, un tiret
comme séparateur. `Instagram` et `instagram` compteraient comme deux sources
différentes.

## Les liens à coller

### Instagram

**Bio du profil** — le lien principal, celui qui prend le plus de clics :

```
https://permis-maison-individuelle.fr/?utm_source=instagram&utm_medium=bio
```

**Second lien de bio**, pour envoyer directement sur les prix :

```
https://permis-maison-individuelle.fr/tarifs?utm_source=instagram&utm_medium=bio
```

**Sticker « lien » en story** — à adapter selon ce que montre la story :

```
https://permis-maison-individuelle.fr/plan-de-masse?utm_source=instagram&utm_medium=story
https://permis-maison-individuelle.fr/tarifs?utm_source=instagram&utm_medium=story
https://permis-maison-individuelle.fr/devis?utm_source=instagram&utm_medium=story
```

**Publication qui renvoie à un article** — remplacez le slug :

```
https://permis-maison-individuelle.fr/conseils/surface-de-plancher-emprise-au-sol-surface-taxable?utm_source=instagram&utm_medium=post
```

### LinkedIn

**Champ « Site web » du profil** :

```
https://permis-maison-individuelle.fr/?utm_source=linkedin&utm_medium=profil
```

**Publication LinkedIn** :

```
https://permis-maison-individuelle.fr/tarifs?utm_source=linkedin&utm_medium=post
```

### Fiche Google

**Champ « Site web » de la fiche d'établissement** :

```
https://permis-maison-individuelle.fr/?utm_source=google&utm_medium=fiche
```

> Un point de prudence : certains préfèrent laisser l'URL nue dans la fiche
> Google, par crainte qu'un paramètre gêne l'association entre la fiche et le
> site. Google gère les `utm_*` sans difficulté et l'usage est répandu, mais si
> vous voulez écarter tout risque, laissez l'adresse nue dans la fiche — les
> visiteurs venus de Google Maps resteront alors comptés en « direct ».

## Comment lire les résultats

Dans Vercel → Analytics → onglet **UTM Parameters**. Vous y verrez le nombre de
visiteurs par `utm_source` et par `utm_medium`.

Pour mesurer ce que chaque canal **rapporte** et pas seulement ce qu'il envoie,
croisez avec l'onglet **Pages** : les pages `/devis/merci/*` comptent les
demandes reçues, une ligne par formule. Un canal qui envoie beaucoup de monde
sans jamais produire de demande vous dira quelque chose d'utile.

## Ce qui ne risque rien

Ces paramètres n'ont **aucun effet sur le référencement** : chaque page du site
porte une balise `canonical` qui pointe vers son adresse propre, sans paramètre.
Google ne verra donc jamais `/?utm_source=instagram` comme une page distincte de
`/`.

Ils n'apparaissent pas non plus dans le sitemap, et ne déclenchent rien côté
serveur.

## Si vous passez un jour en Pro

Les événements personnalisés deviendraient disponibles, et les sept `trackEvent`
déjà posés dans le code se mettraient à remonter seuls : clics sur les appels à
l'action, formule retenue dans le sélecteur, tranche de surface des demandes.
Les liens marqués resteraient utiles pour autant — ils répondent à une autre
question, celle de la provenance.
