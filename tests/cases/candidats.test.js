"use strict";

module.exports = ({ ctx, it, assertTrue, assertEqual }) => {
  const { construireTableauCandidats } = ctx;

  it("liste uniquement les joueurs de la bonne catégorie, triés par score décroissant", () => {
    const creneau = {
      nom: "Lundi 21H",
      categorie: "Homme adulte",
      effectif: 4,
      surbooking: 0,
      actif: true,
      joueurs: [{ nom: "EXISTANT", categorie: "Homme adulte", niveau: 100, age: 40 }],
    };

    const joueurs = [
      { nom: "BON_NIVEAU", prenom: "A", licence: "1", categorie: "Homme adulte", niveau: 100, age: 40, competition: false, voeux: ["Lundi 21H"], affectation: null },
      { nom: "AUTRE_NIVEAU", prenom: "B", licence: "2", categorie: "Homme adulte", niveau: 60, age: 40, competition: false, voeux: [], affectation: null },
      { nom: "FEMME", prenom: "C", licence: "3", categorie: "Femme", niveau: 100, age: 30, competition: false, voeux: [], affectation: null }, // ne doit jamais apparaître
    ];

    const lignes = construireTableauCandidats(joueurs, [creneau], {});
    const nomsListes = lignes.slice(1, -1).map((l) => l[1]); // colonne Nom, sans entête ni ligne de séparation

    assertTrue(!nomsListes.includes("FEMME"), "une joueuse Femme ne doit jamais apparaître pour un créneau Homme adulte");
    assertEqual(nomsListes[0], "BON_NIVEAU", "le meilleur score (niveau proche) doit apparaître en premier");
  });

  it("indique le voeu et le statut actuel du joueur", () => {
    const creneau = { nom: "Lundi 21H", categorie: "Homme adulte", effectif: 4, surbooking: 0, actif: true, joueurs: [] };

    const joueurs = [
      { nom: "DUPONT", prenom: "Jean", licence: "1", categorie: "Homme adulte", niveau: 100, age: 40, competition: false, voeux: ["Lundi 21H"], affectation: "Mardi 19H" },
    ];

    const lignes = construireTableauCandidats(joueurs, [creneau], {});
    const ligneJoueur = lignes[1];

    assertEqual(ligneJoueur[5], "Voeu 1", "doit indiquer que Lundi 21H est son 1er voeu");
    assertTrue(ligneJoueur[6].includes("Mardi 19H"), "doit indiquer où il est actuellement affecté");
  });

  it("signale un créneau sans aucun candidat", () => {
    const creneau = { nom: "Samedi 8H", categorie: "College", effectif: 4, surbooking: 0, actif: true, joueurs: [] };
    const joueurs = [{ nom: "X", prenom: "Y", licence: "1", categorie: "Homme adulte", niveau: 100, age: 40, competition: false, voeux: [], affectation: null }];

    const lignes = construireTableauCandidats(joueurs, [creneau], {});

    assertEqual(lignes[1][1], "Aucun candidat");
  });

  it(
    "régression : le statut actuel doit refléter les vraies affectations de Groupes, " +
      "pas toujours afficher \"Sans créneau\" (bug : joueurs rechargés frais depuis Licenciés)",
    () => {
      ctx.__resetSheets();

      const joueurs = [
        { nom: "DUPONT", prenom: "Jean", licence: "1", categorie: "Homme adulte", niveau: 100, age: 40, competition: false, voeux: ["Lundi 21H"], affectation: null },
      ];

      const creneauLundi = { nom: "Lundi 21H", categorie: "Homme adulte", effectif: 4, surbooking: 0, actif: true, joueurs: [] };
      const creneauMardi = { nom: "Mardi 19H", categorie: "Homme adulte", effectif: 4, surbooking: 0, actif: true, joueurs: [] };

      ctx.__setSheetData("Groupes", [
        ["Créneau", "Catégorie", "Nom", "Prénom", "Licence", "Age", "Classement", "Niveau", "Sexe", "Compétition", "Nouveau", "Fixé", "Repli", "Alternative suggérée"],
        ["Lundi 21H", "Homme adulte", "DUPONT", "Jean", "1", 40, "NC", 100, "H", "Non", "Non", "Non", "Non", ""],
      ]);

      const creneaux = ctx.chargerGroupesDepuisFeuille(joueurs, [creneauLundi, creneauMardi]);

      const lignes = construireTableauCandidats(joueurs, creneaux, {});

      const ligneSurMardi = lignes.find((l) => l[0] === "Mardi 19H" && l[1] === "DUPONT");

      assertTrue(ligneSurMardi !== undefined, "DUPONT doit apparaître comme candidat sur Mardi 19H aussi");
      assertTrue(
        ligneSurMardi[6].includes("Lundi 21H"),
        "le statut doit indiquer qu'il est déjà affecté sur Lundi 21H, pas \"Sans créneau\" (obtenu : " + ligneSurMardi[6] + ")",
      );
    },
  );
};
