"use strict";

module.exports = ({ ctx, it, assertEqual, assertTrue, assertFalse }) => {
  const { lireVoeux, construireIndex, cleComparaisonTexte, voeuCompatible } = ctx;

  it('lit les voeux avec les en-têtes réelles "1er Voeu".."5eme Voeu"', () => {
    const headers = ["Nom", "1er Voeu", "2eme Voeu", "3eme Voeu", "4eme Voeu", "5eme Voeu"];
    const index = construireIndex(headers);
    const ligne = ["PITEL", "Lundi 19H", "Mardi 19H", "Mardi 20H", "", ""];

    assertEqual(lireVoeux(ligne, index, {}), ["Lundi 19H", "Mardi 19H", "Mardi 20H"]);
  });

  it("retombe sur une correspondance insensible à la casse/ligature si l'en-tête exacte manque", () => {
    const headers = ["Nom", "1er Vœu", "2eme Vœu"]; // ligature œ, pas "1er Voeu" exact
    const index = construireIndex(headers);
    const indexNormalise = ctx.construireIndexEnTetesNormalise(headers);
    const ligne = ["MARTIN", "Lundi 19H", ""];

    assertEqual(lireVoeux(ligne, index, indexNormalise), ["Lundi 19H"]);
  });

  it("cleComparaisonTexte ignore la casse et les espaces superflus", () => {
    assertEqual(cleComparaisonTexte("  Lundi   21H "), cleComparaisonTexte("lundi 21h"));
  });

  it("voeuCompatible matche malgré une casse différente (Lundi 21h vs Lundi 21H)", () => {
    const joueur = { voeux: ["Lundi 21h"] };
    const creneau = { nom: "Lundi 21H" };

    assertTrue(voeuCompatible(joueur, creneau));
  });

  it("voeuCompatible bloque un créneau qui n'est vraiment pas dans les voeux", () => {
    const joueur = { voeux: ["Lundi 21H"] };
    const creneau = { nom: "Mercredi 18H" };

    assertFalse(voeuCompatible(joueur, creneau));
  });

  it("voeuCompatible autorise tout créneau si le joueur n'a renseigné aucun voeu", () => {
    const joueur = { voeux: [] };
    const creneau = { nom: "Mercredi 18H" };

    assertTrue(voeuCompatible(joueur, creneau));
  });
};
