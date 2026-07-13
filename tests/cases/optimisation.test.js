"use strict";

module.exports = ({ ctx, it, assertTrue, assertEqual }) => {
  const { initialiserGroupesV2, chargerGroupesDepuisFeuille, affecterJoueursV2, optimiserRepartition } = ctx;

  it(
    "un créneau qui mélange joueurs verrouillés et non-verrouillés ne corrompt jamais ses occupants " +
      "pendant l'optimisation (régression réelle : 3 joueurs fixés remplacés par 4x le même joueur)",
    () => {
      ctx.__resetSheets();

      const joueurs = [
        { nom: "BARRE", prenom: "Yves", licence: "1111088 D", categorie: "Homme adulte", age: 45, classement: "30/3", niveau: 100, sexe: "H", competition: true, nouveau: false, voeux: ["Lundi 21H"], affectation: null, verrouille: false },
        { nom: "LEPROUST", prenom: "Cédric", licence: "1754352 D", categorie: "Homme adulte", age: 45, classement: "30/1", niveau: 100, sexe: "H", competition: true, nouveau: false, voeux: ["Lundi 21H"], affectation: null, verrouille: false },
        { nom: "ALLIOU", prenom: "Gael", licence: "1055870 J", categorie: "Homme adulte", age: 51, classement: "30", niveau: 100, sexe: "H", competition: true, nouveau: false, voeux: ["Lundi 21H"], affectation: null, verrouille: false },
        { nom: "COURTEL", prenom: "Angelo", licence: "3188354 B", categorie: "Homme adulte", age: 42, classement: "40", niveau: 80, sexe: "H", competition: false, nouveau: false, voeux: ["Lundi 21H", "Jeudi 21H"], affectation: null, verrouille: false },
        { nom: "MOREAU", prenom: "Paul", licence: "9999999 Z", categorie: "Homme adulte", age: 40, classement: "40", niveau: 80, sexe: "H", competition: false, nouveau: false, voeux: ["Jeudi 21H"], affectation: null, verrouille: false },
      ];

      const creneaux = [
        { nom: "Lundi 21H", categorie: "Homme adulte", effectif: 4, capacite: 4, surbooking: 0, actif: true, joueurs: [] },
        { nom: "Jeudi 21H", categorie: "Homme adulte", effectif: 4, capacite: 4, surbooking: 0, actif: true, joueurs: [] },
      ];

      ctx.__setSheetData("Groupes", [
        ["Créneau", "Catégorie", "Nom", "Prénom", "Licence", "Age", "Classement", "Niveau", "Sexe", "Compétition", "Nouveau", "Fixé", "Repli", "Alternative suggérée"],
        ["Lundi 21H", "Homme adulte", "BARRE", "Yves", "1111088 D", 45, "30/3", 100, "H", "Oui", "Non", "Oui", "Non", ""],
        ["Lundi 21H", "Homme adulte", "LEPROUST", "Cédric", "1754352 D", 45, "30/1", 100, "H", "Oui", "Non", "Oui", "Non", ""],
        ["Lundi 21H", "Homme adulte", "ALLIOU", "Gael", "1055870 J", 51, "30", 100, "H", "Oui", "Non", "Oui", "Non", ""],
        ["Lundi 21H", "Homme adulte", "COURTEL", "Angelo", "3188354 B", 42, "40", 80, "H", "Oui", "Non", "Non", "Non", "Jeudi 21H"],
      ]);

      const creneauxInit = initialiserGroupesV2(creneaux);
      chargerGroupesDepuisFeuille(joueurs, creneauxInit, { onlyFixed: true });

      const config = {};
      const resultat = affecterJoueursV2(joueurs, creneauxInit, config);
      const groupes = resultat.creneaux;

      optimiserRepartition(groupes, { iterations: 500, config });

      const lundi = groupes.find((c) => c.nom === "Lundi 21H");

      const licencesUniques = new Set(lundi.joueurs.map((j) => j.licence));

      assertEqual(
        licencesUniques.size,
        lundi.joueurs.length,
        "aucun joueur ne doit apparaître plusieurs fois dans le même créneau",
      );

      const fixesToujoursPresents = ["1111088 D", "1754352 D", "1055870 J"].every((lic) =>
        lundi.joueurs.some((j) => j.licence === lic),
      );

      assertTrue(fixesToujoursPresents, "les 3 joueurs verrouillés doivent tous être encore présents sur leur créneau");
    },
  );
};
