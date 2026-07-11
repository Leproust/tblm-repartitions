"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { execSync } = require("child_process");
const { createStubs } = require("./gas-stubs");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

function listerFichiers(dir, extension) {
  let resultats = [];

  for (const entree of fs.readdirSync(dir, { withFileTypes: true })) {
    const chemin = path.join(dir, entree.name);

    if (entree.isDirectory()) {
      resultats = resultats.concat(listerFichiers(chemin, extension));
    } else if (entree.name.endsWith(extension) && !entree.name.endsWith(".d.ts")) {
      resultats.push(chemin);
    }
  }

  return resultats;
}

/**
 * Transpile tous les .ts de src/ (types retirés) et renvoie le
 * code JS concaténé. Apps Script n'a pas de modules : tous les
 * fichiers partagent le même scope global, donc on reproduit ça
 * ici en concaténant tout, peu importe l'ordre des fichiers
 * (les fonctions sont hoistées, et les constantes de config ne
 * sont lues qu'au moment de l'appel, jamais au chargement).
 */
function transpilerProjet() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "repartition-tests-"));

  const fichiers = listerFichiers(SRC, ".ts");

  const commande = [
    "npx tsc",
    "--outDir", JSON.stringify(tmpDir),
    "--rootDir", JSON.stringify(SRC),
    "--target es2019",
    "--module none",
    "--skipLibCheck",
    "--allowJs",
    fichiers.map((f) => JSON.stringify(f)).join(" "),
  ].join(" ");

  try {
    execSync(commande, { stdio: "pipe", cwd: ROOT });
  } catch (e) {
    /*
      Le vrai tsconfig du projet est probablement plus strict
      (noImplicitAny, etc.) que cette transpilation minimale :
      tsc peut donc renvoyer un code d'erreur tout en ayant
      quand même émis les .js. Ce n'est pas bloquant ici, on
      vérifie juste après qu'au moins un fichier a été généré.
    */
  }

  const jsFiles = listerFichiers(tmpDir, ".js");

  if (jsFiles.length === 0) {
    fs.rmSync(tmpDir, { recursive: true, force: true });

    throw new Error(
      "Aucun fichier JS généré par tsc. Vérifiez qu'il est disponible " +
        "(essayez : npx tsc --version) et que src/ contient des fichiers .ts.",
    );
  }

  const bundle = jsFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n;\n");

  fs.rmSync(tmpDir, { recursive: true, force: true });

  return bundle;
}

/**
 * Transpile puis exécute le projet dans un contexte "vm" isolé,
 * avec les globals Apps Script simulés. Renvoie ce contexte :
 * toutes les fonctions du projet (categorieCompatible,
 * voeuCompatible, affecterJoueursV2, ...) sont accessibles
 * directement dessus, exactement comme dans Apps Script où tout
 * partage le même scope global.
 */
function chargerProjet() {
  const bundle = transpilerProjet();

  const stubs = createStubs();

  const sandbox = Object.assign(
    {
      console,
      JSON,
      Math,
      Date,
      Set,
      Map,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
    },
    stubs,
  );

  vm.createContext(sandbox);

  vm.runInContext(bundle, sandbox, { filename: "repartition-bundle.js" });

  return sandbox;
}

module.exports = { chargerProjet, ROOT, SRC };
