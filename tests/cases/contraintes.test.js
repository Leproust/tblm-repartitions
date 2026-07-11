"use strict";

module.exports = ({ ctx, it, assertEqual, assertTrue, assertFalse }) => {
  const {
    categorieCompatible,
    creneauActif,
    competitionCompatible,
    affectationPossible,
    creneauxPossibles,
  } = ctx;

  it("un homme adulte n'est jamais compatible avec un créneau Femme", () => {
    const joueur = { categorie: "Homme adulte" };
    const creneau = { categorie: "Femme" };

    assertFalse(categorieCompatible(joueur, creneau));
  });

  it("une femme n'est jamais compatible avec un créneau Homme adulte", () => {
    const joueur = { categorie: "Femme" };
    const creneau = { categorie: "Homme adulte" };

    assertFalse(categorieCompatible(joueur, creneau));
  });

  it("le mélange Homme/Femme reste bloqué MEME en repli compétition (jamais automatique)", () => {
    const joueur = {
      nom: "GALLAIS",
      prenom: "Léna",
      categorie: "Femme",
      competition: false,
      voeux: ["Lundi 21H"],
      age: 20,
    };

    const creneauHommes = {
      nom: "Lundi 21H",
      categorie: "Homme adulte",
      actif: true,
      effectif: 4,
      surbooking: 2,
      joueurs: [{ categorie: "Homme adulte", competition: true, age: 40 }],
    };

    const strict = creneauxPossibles(joueur, [creneauHommes]);
    const repli = creneauxPossibles(joueur, [creneauHommes], { ignorerCompetition: true });

    assertEqual(strict.length, 0, "aucun créneau possible en mode strict");
    assertEqual(repli.length, 0, "toujours aucun créneau possible même en repli compétition");
  });

  it("un créneau marqué actif=false est exclu", () => {
    assertFalse(creneauActif({ actif: false }));
  });

  it("un créneau sans champ actif est actif par défaut (undefined = actif)", () => {
    assertTrue(creneauActif({}));
  });

  it("un créneau actif=true reste actif", () => {
    assertTrue(creneauActif({ actif: true }));
  });

  it("competitionCompatible bloque un mélange compétition/non-compétition en mode strict", () => {
    const joueur = { competition: false };
    const creneau = { joueurs: [{ competition: true }] };

    assertFalse(competitionCompatible(joueur, creneau));
  });

  it("affectationPossible avec ignorerCompetition autorise le mélange compétition en dernier recours", () => {
    const joueur = { categorie: "Homme adulte", competition: false, voeux: [], age: 30 };

    const creneau = {
      nom: "Mardi 19H",
      categorie: "Homme adulte",
      actif: true,
      effectif: 2,
      surbooking: 1,
      joueurs: [
        { competition: true, categorie: "Homme adulte", age: 30 },
        { competition: true, categorie: "Homme adulte", age: 32 },
      ],
    };

    assertFalse(affectationPossible(joueur, creneau), "strict : doit être refusé (complet + compétition différente)");

    assertTrue(
      affectationPossible(joueur, creneau, { ignorerCompetition: true }),
      "repli : doit être accepté via le surbooking",
    );
  });
};
