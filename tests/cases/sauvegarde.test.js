"use strict";

module.exports = ({ ctx, it, assertTrue, assertEqual }) => {
  it("ne fait rien si la feuille n'existe pas encore", () => {
    ctx.__resetSheets();

    const resultat = ctx.sauvegarderFeuilleAvantEcrasement("Groupes");

    assertEqual(resultat, null);
  });

  it("ne fait rien si la feuille est vide (rien à perdre)", () => {
    ctx.__resetSheets();
    ctx.__setSheetData("Groupes", [["Créneau", "Nom"]]); // juste l'entête

    const resultat = ctx.sauvegarderFeuilleAvantEcrasement("Groupes");

    assertEqual(resultat, null);
  });

  it("crée une copie horodatée quand la feuille contient des données", () => {
    ctx.__resetSheets();
    ctx.__setSheetData("Groupes", [
      ["Créneau", "Nom"],
      ["Lundi 21H", "BARRE"],
    ]);

    const copie = ctx.sauvegarderFeuilleAvantEcrasement("Groupes");

    assertTrue(copie !== null, "une copie doit être créée");
    assertTrue(copie.name.indexOf("Groupes_backup_") === 0, "le nom doit commencer par le préfixe attendu");
  });

  it("ne garde jamais plus de maxBackups sauvegardes", () => {
    ctx.__resetSheets();
    ctx.__setSheetData("Groupes", [
      ["Créneau", "Nom"],
      ["Lundi 21H", "BARRE"],
    ]);

    /*
      On pré-remplit de fausses sauvegardes déjà existantes avec
      des noms distincts (plutôt que de compter sur la précision
      de l'horodatage réel sur des appels rapprochés).
    */

    for (let i = 0; i < 6; i++) {
      ctx.__setSheetData("Groupes_backup_2026-01-0" + (i + 1) + "_10h00", [["x"]]);
    }

    ctx.sauvegarderFeuilleAvantEcrasement("Groupes", 3);

    const nomsBackups = ctx.SpreadsheetApp.getActive()
      .getSheets()
      .map((s) => s.name)
      .filter((n) => n.indexOf("Groupes_backup_") === 0);

    assertTrue(
      nomsBackups.length <= 3,
      "au maximum 3 sauvegardes doivent être conservées, obtenu " + nomsBackups.length,
    );
  });
};
