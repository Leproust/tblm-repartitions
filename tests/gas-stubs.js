"use strict";

/**
 * ===========================================================
 * Simulateurs minimaux des objets globaux Google Apps Script
 * ===========================================================
 *
 * Le code du projet (src/) est écrit pour tourner dans Google
 * Apps Script, où SpreadsheetApp/Logger/etc. existent nativement.
 * Pour pouvoir tester la logique en dehors de Google Sheets (donc
 * en une commande, sans ouvrir un tableur), on fournit ici de
 * fausses implémentations en mémoire suffisantes pour que le
 * code s'exécute normalement.
 *
 * Ce ne sont PAS des mocks qui vérifient des appels : ce sont de
 * vraies petites implémentations (feuilles en mémoire, avec
 * getRange/setValues/getDataRange qui se comportent comme un
 * vrai Sheet), pour que les tests puissent lire/écrire des
 * données réalistes si besoin.
 */
function createStubs() {
  const sheets = new Map();

  function makeSheet(name) {
    return {
      name,
      data: [],

      getName() {
        return this.name;
      },

      clear() {
        this.data = [];
        return this;
      },

      getRange(row, col, numRows, numCols) {
        const sheet = this;

        return {
          setValues(values) {
            for (let i = 0; i < values.length; i++) {
              sheet.data[row - 1 + i] = values[i].slice();
            }

            return this;
          },

          setFontWeight() {
            return this;
          },

          setBorder() {
            return this;
          },
        };
      },

      getDataRange() {
        const sheet = this;

        return {
          getValues() {
            return sheet.data.map((ligne) => ligne.slice());
          },
        };
      },

      getLastColumn() {
        return this.data.reduce((max, ligne) => Math.max(max, ligne.length), 0);
      },

      autoResizeColumns() {
        return this;
      },

      setFrozenRows() {
        return this;
      },

      copyTo(destinationSpreadsheet) {
        const copie = makeSheet(this.name + " (copie)");

        copie.data = this.data.map((ligne) => ligne.slice());

        sheets.set(copie.name, copie);

        return copie;
      },

      setName(nom) {
        sheets.delete(this.name);

        this.name = nom;

        sheets.set(nom, this);

        return this;
      },

      appendRow(ligne) {
        this.data.push(ligne.slice());
        return this;
      },
    };
  }

  const activeSpreadsheet = {
    getSheetByName(name) {
      return sheets.get(name) || null;
    },

    insertSheet(name) {
      const feuille = makeSheet(name);

      sheets.set(name, feuille);

      return feuille;
    },

    deleteSheet(feuille) {
      sheets.delete(feuille.name);
    },

    getSheets() {
      return Array.from(sheets.values());
    },

    toast() {},
  };

  return {
    /*
      Accès direct pour les tests qui veulent poser des
      données dans une feuille avant d'appeler une fonction
      du projet (ex: remplir "Groupes" avant d'appeler
      exporterOccupation).
    */
    __sheets: sheets,

    __resetSheets() {
      sheets.clear();
    },

    __setSheetData(nom, lignes) {
      const feuille = sheets.get(nom) || activeSpreadsheet.insertSheet(nom);

      feuille.data = lignes.map((l) => l.slice());

      return feuille;
    },

    Logger: {
      log() {},
    },

    SpreadsheetApp: {
      getActive: () => activeSpreadsheet,

      getUi: () => ({
        createMenu: () => ({
          addItem() {
            return this;
          },
          addSeparator() {
            return this;
          },
          addToUi() {},
        }),
      }),
    },

    Utilities: {
      sleep() {},

      formatDate(date) {
        return date instanceof Date ? date.toISOString() : String(date);
      },
    },

    Session: {
      getScriptTimeZone: () => "Europe/Paris",
    },

    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: () => null,
        setProperty() {},
      }),
    },
  };
}

module.exports = { createStubs };
