"use strict";

module.exports = ({ ctx, it, assertTrue }) => {
  const { scoreCreneauCompletV2 } = ctx;

  it("le score d'un groupe complet à 100% ne s'auto-bloque pas via son propre contrôle de capacité", () => {
    const creneau = {
      nom: "Lundi 21H",
      categorie: "Homme adulte",
      actif: true,
      effectif: 2,
      surbooking: 0,
      joueurs: [
        { nom: "A", categorie: "Homme adulte", competition: false, age: 40, niveau: 100, sexe: "H", voeux: [] },
        { nom: "B", categorie: "Homme adulte", competition: false, age: 42, niveau: 110, sexe: "H", voeux: [] },
      ],
    };

    const score = scoreCreneauCompletV2(creneau, {});

    assertTrue(
      score > -1000,
      "le score ne doit pas être écrasé par le garde-fou de capacité (obtenu " + score + ")",
    );
  });

  it("un joueur placé en repli compétition est marqué visiblement dans l'export (colonne Repli)", () => {
    const { construireTableauExport } = ctx;

    const creneau = {
      nom: "Mardi 19H",
      categorie: "Homme adulte",
      joueurs: [
        { nom: "DUPONT", prenom: "Marc", licence: "1", age: 30, classement: "NC", niveau: 0, sexe: "H", competition: false, nouveau: false, verrouille: false, repliCompetition: true },
        { nom: "MARTIN", prenom: "Luc", licence: "2", age: 32, classement: "NC", niveau: 0, sexe: "H", competition: true, nouveau: false, verrouille: false, repliCompetition: false },
      ],
    };

    const lignes = construireTableauExport([creneau]);
    const indexRepli = lignes[0].indexOf("Repli");

    assertTrue(indexRepli !== -1, "la colonne Repli doit exister dans l'en-tête");
    assertTrue(lignes[1][indexRepli] === "Oui", "DUPONT est en repli -> Oui");
    assertTrue(lignes[2][indexRepli] === "Non", "MARTIN n'est pas en repli -> Non");
  });

  it("propose une alternative suggérée quand un autre créneau compatible existe", () => {
    const { construireTableauExport } = ctx;

    const joueur = {
      nom: "DUPONT", prenom: "Marc", licence: "1", categorie: "Homme adulte",
      age: 30, classement: "NC", niveau: 100, sexe: "H", competition: false,
      nouveau: false, verrouille: false, repliCompetition: false,
      voeux: ["Lundi 21H", "Mardi 19H"],
    };

    const creneauActuel = {
      nom: "Lundi 21H", categorie: "Homme adulte", actif: true, effectif: 4, surbooking: 0,
      joueurs: [joueur],
    };

    const creneauAlternatif = {
      nom: "Mardi 19H", categorie: "Homme adulte", actif: true, effectif: 4, surbooking: 0,
      joueurs: [],
    };

    const lignes = construireTableauExport([creneauActuel, creneauAlternatif], {});
    const indexAlternative = lignes[0].indexOf("Alternative suggérée");

    assertTrue(indexAlternative !== -1, "la colonne Alternative suggérée doit exister");
    assertTrue(lignes[1][indexAlternative] === "Mardi 19H", "doit suggérer l'autre créneau de son voeu");
  });

  it("ne propose pas d'alternative pour un joueur verrouillé (Fixé)", () => {
    const { construireTableauExport } = ctx;

    const joueur = {
      nom: "DUPONT", prenom: "Marc", licence: "1", categorie: "Homme adulte",
      age: 30, classement: "NC", niveau: 100, sexe: "H", competition: false,
      nouveau: false, verrouille: true, repliCompetition: false,
      voeux: ["Lundi 21H", "Mardi 19H"],
    };

    const creneauActuel = {
      nom: "Lundi 21H", categorie: "Homme adulte", actif: true, effectif: 4, surbooking: 0,
      joueurs: [joueur],
    };

    const creneauAlternatif = {
      nom: "Mardi 19H", categorie: "Homme adulte", actif: true, effectif: 4, surbooking: 0,
      joueurs: [],
    };

    const lignes = construireTableauExport([creneauActuel, creneauAlternatif], {});
    const indexAlternative = lignes[0].indexOf("Alternative suggérée");

    assertTrue(lignes[1][indexAlternative] === "", "un joueur verrouillé ne doit pas avoir d'alternative suggérée");
  });
};
