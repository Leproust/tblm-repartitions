"use strict";

module.exports = ({ ctx, it, assertEqual, assertTrue }) => {
  const { diagnostiquerCoherenceDonnees } = ctx;

  it("détecte deux créneaux qui partagent le même nom", () => {
    const creneaux = [
      { nom: "Lundi 21H", categorie: "Homme adulte" },
      { nom: "lundi  21h", categorie: "Femme" }, // même nom, casse/espaces différents
    ];

    const problemes = diagnostiquerCoherenceDonnees([], creneaux, {});
    const trouve = problemes.some((p) => p.type === "CRENEAU_DUPLIQUE");

    assertTrue(trouve, "doit détecter le doublon malgré la casse/espaces différents");
  });

  it("détecte un voeu qui ne correspond à aucun créneau existant (faute de frappe)", () => {
    const creneaux = [{ nom: "Lundi 21H", categorie: "Homme adulte" }];
    const joueurs = [{ nom: "DUPONT", prenom: "Jean", voeux: ["Lundi 21H", "Mercredi 99H"] }];

    const problemes = diagnostiquerCoherenceDonnees(joueurs, creneaux, {});
    const trouve = problemes.some((p) => p.type === "VOEU_INCONNU" && p.detail.includes("Mercredi 99H"));

    assertTrue(trouve, "doit signaler le voeu qui ne matche aucun créneau");
  });

  it("ne signale rien quand les données sont cohérentes", () => {
    const creneaux = [{ nom: "Lundi 21H", categorie: "Homme adulte" }];
    const joueurs = [{ nom: "DUPONT", prenom: "Jean", voeux: ["Lundi 21H"] }];

    const problemes = diagnostiquerCoherenceDonnees(joueurs, creneaux, { "Poids niveau": "90" });

    assertEqual(problemes, []);
  });

  it("détecte un poids de config négatif ou non numérique", () => {
    const problemes = diagnostiquerCoherenceDonnees([], [], { "Poids niveau": "-5" });
    const trouve = problemes.some((p) => p.type === "POIDS_INVALIDE");

    assertTrue(trouve, "un poids négatif doit être signalé");
  });
};
