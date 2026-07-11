"use strict";

module.exports = ({ ctx, it, assertEqual }) => {
  const { trouverJoueursSansCreneau } = ctx;

  it("ne liste que les joueurs réellement absents des affectations connues (par licence)", () => {
    const affectes = {
      licences: new Set(["111"]),
      nomsPrenoms: new Set(),
    };

    const joueurs = [
      { nom: "Dupont", prenom: "Jean", licence: "111" },
      { nom: "Martin", prenom: "Alice", licence: "222" },
    ];

    const resultat = trouverJoueursSansCreneau(joueurs, affectes);

    assertEqual(resultat.map((j) => j.nom), ["Martin"]);
  });

  it("retombe sur Nom+Prénom si la licence est absente", () => {
    const affectes = {
      licences: new Set(),
      nomsPrenoms: new Set(["dupont|jean"]),
    };

    const joueurs = [
      { nom: "Dupont", prenom: "Jean", licence: "" },
      { nom: "Martin", prenom: "Alice", licence: "" },
    ];

    const resultat = trouverJoueursSansCreneau(joueurs, affectes);

    assertEqual(resultat.map((j) => j.nom), ["Martin"]);
  });
};
