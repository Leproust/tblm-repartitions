# Tests

Suite de tests pour la logique métier du projet (règles d'affectation,
scoring, lecture des vœux, détection des joueurs sans créneau...).

Couvre les régressions qu'on a rencontrées et corrigées ensemble : vœux mal
lus, mélange Homme/Femme, repli compétition, "0 inscrit"...

## Lancer les tests

```bash
node tests/run-tests.js
```

Aucune dépendance à installer en plus de celles déjà utilisées par le
projet (`typescript`, via `npx tsc`).

## Comment ça marche

Apps Script n'a pas de modules : tous les fichiers de `src/` partagent le
même scope global une fois déployés. `tests/load-project.js` reproduit
exactement ça pour les tests, en chargeant le **vrai code source** (pas une
copie qui risquerait de diverger) :

1. transpile tous les `.ts` de `src/` (types retirés, via `tsc`),
2. concatène tout le JS obtenu,
3. l'exécute dans un contexte isolé (module `vm` de Node) où
   `SpreadsheetApp`, `Logger`, `Utilities`, `Session` et
   `PropertiesService` sont simulés en mémoire (`tests/gas-stubs.js`),
4. renvoie ce contexte : toutes les fonctions du projet
   (`categorieCompatible`, `voeuCompatible`, `affecterJoueursV2`, ...)
   sont directement accessibles dessus, exactement comme dans Apps Script.

Comme c'est le vrai code qui est chargé (pas une copie), un test qui passe
aujourd'hui reste valable tant que le comportement ne change pas — pas
besoin de répercuter un changement à deux endroits.

## Ajouter un test

Créer un fichier `tests/cases/mon-sujet.test.js` :

```js
module.exports = ({ ctx, it, assertEqual, assertTrue, assertFalse }) => {
  it("description du comportement attendu", () => {
    const resultat = ctx.maFonctionDuProjet(/* ... */);
    assertTrue(resultat);
  });
};
```

Le fichier est chargé automatiquement (tous les `*.test.js` du dossier
`cases/`, par ordre alphabétique).

## Ce qui est couvert aujourd'hui

- `voeux.test.js` — lecture des colonnes de vœux (en-têtes réelles "1er
  Voeu".."5eme Voeu", tolérance casse/ligature en secours), comparaison
  vœu ↔ créneau insensible à la casse/espaces.
- `contraintes.test.js` — catégorie stricte Homme/Femme (jamais de mélange,
  même en repli), créneau actif/inactif, repli compétition à deux passes.
- `scoring.test.js` — un groupe complet à 100% ne doit pas se bloquer
  lui-même via son propre contrôle de capacité.
- `pilotage.test.js` — détection des joueurs sans créneau par licence, avec
  repli sur Nom+Prénom.

Cette suite n'est pas exhaustive : elle couvre les bugs qu'on a rencontrés
et corrigés ensemble. À enrichir au fil de l'eau, en particulier avant de
toucher à `contraintes.ts`, `scoreV2.ts` ou `optimisation.ts`.

## Un bug repéré en prod ?

Ajoute d'abord un test qui le reproduit ici, puis corrige le code : ça
évite de le revoir sans s'en rendre compte.
