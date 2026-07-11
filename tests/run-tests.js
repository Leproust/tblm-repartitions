#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { chargerProjet } = require("./load-project");

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);

  if (a !== e) {
    throw new Error(`${message ? message + " : " : ""}attendu ${e}, obtenu ${a}`);
  }
}

function assertTrue(valeur, message) {
  if (!valeur) {
    throw new Error(message || "attendu une valeur vraie (truthy)");
  }
}

function assertFalse(valeur, message) {
  if (valeur) {
    throw new Error(message || "attendu une valeur fausse (falsy)");
  }
}

function main() {
  console.log("Compilation du projet (src/) pour les tests...\n");

  const ctx = chargerProjet();

  const casesDir = path.join(__dirname, "cases");

  const fichiers = fs
    .readdirSync(casesDir)
    .filter((f) => f.endsWith(".test.js"))
    .sort();

  let total = 0;
  let echecs = 0;

  for (const fichier of fichiers) {
    console.log(fichier.replace(".test.js", ""));

    const definirTests = require(path.join(casesDir, fichier));

    const it = (description, fn) => {
      total++;

      try {
        fn();

        console.log("  \u2713 " + description);
      } catch (e) {
        echecs++;

        console.log("  \u2717 " + description);
        console.log("    " + e.message);
      }
    };

    definirTests({ ctx, it, assertEqual, assertTrue, assertFalse });

    console.log("");
  }

  console.log("---");
  console.log(`${total - echecs}/${total} tests réussis.`);

  if (echecs > 0) {
    process.exit(1);
  }
}

main();
