/**
 * ===========================================================
 * CANDIDATS PAR CRENEAU
 *
 * Vue "inverse" de l'affectation : plutôt que de partir d'un
 * joueur pour trouver son créneau (comme le fait le calcul, ou
 * la colonne "Alternative suggérée" de l'export Groupes), on
 * part de chaque créneau et on liste TOUS les joueurs qui
 * pourraient théoriquement y aller — pour faciliter les
 * ajustements manuels du coach.
 *
 * Seule la catégorie est un filtre dur (jamais négociable,
 * comme partout ailleurs dans le projet : Homme/Femme jamais
 * mélangés, jeunes cantonnés à leur catégorie ± une catégorie
 * voisine). L'âge, la compétition et la capacité ne filtrent
 * PAS la liste : ils sont juste affichés en information, pour
 * que le coach garde la main sur la décision finale (par
 * exemple placer quelqu'un via le surbooking même si son statut
 * compétition ne correspond pas).
 * ===========================================================
 */

/**
 * Construit la liste des candidats pour un seul créneau,
 * triée par score décroissant (meilleurs profils en premier).
 */
function candidatsPourCreneau(creneau, joueurs, config) {
  return joueurs
    .filter((joueur) => categorieCompatible(joueur, creneau))
    .map((joueur) => {
      const indexVoeu = (joueur.voeux || []).findIndex(
        (v) => cleComparaisonTexte(v) === cleComparaisonTexte(creneau.nom),
      );

      let statut;

      if (joueur.affectation && cleComparaisonTexte(joueur.affectation) === cleComparaisonTexte(creneau.nom)) {
        statut = "Déjà ici";
      } else if (joueur.affectation) {
        statut = "Ailleurs (" + joueur.affectation + ")";
      } else {
        statut = "Sans créneau";
      }

      return {
        joueur,
        voeu: indexVoeu === -1 ? "" : "Voeu " + (indexVoeu + 1),
        statut,
        competitionOk: competitionCompatible(joueur, creneau),
        ageOk: ageCompatible(joueur, creneau),
        score: calculerScoreV2Brut(joueur, creneau, config),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Construit le tableau complet (tous créneaux) prêt à écrire
 * dans une feuille.
 */
function construireTableauCandidats(joueurs, creneaux, config) {
  const lignes = [];

  lignes.push([
    "Créneau",
    "Nom",
    "Prénom",
    "Licence",
    "Catégorie joueur",
    "Voeu",
    "Statut actuel",
    "Age compatible",
    "Compétition compatible",
    "Score indicatif",
  ]);

  creneaux.forEach((creneau) => {
    const candidats = candidatsPourCreneau(creneau, joueurs, config);

    if (candidats.length === 0) {
      lignes.push([creneau.nom, "Aucun candidat", "", "", "", "", "", "", "", ""]);

      return;
    }

    candidats.forEach((c) => {
      lignes.push([
        creneau.nom,
        c.joueur.nom,
        c.joueur.prenom,
        c.joueur.licence,
        c.joueur.categorie,
        c.voeu,
        c.statut,
        c.ageOk ? "Oui" : "Non",
        c.competitionOk ? "Oui" : "Non",
        Math.round(c.score),
      ]);
    });

    lignes.push(["", "", "", "", "", "", "", "", "", ""]);
  });

  return lignes;
}

/**
 * Ecrit le tableau dans l'onglet dédié.
 */
function exporterCandidatsParCreneau(joueurs, creneaux, config) {
  const feuille = obtenirOuCreerFeuille(SHEETS.CANDIDATS);

  viderFeuille(SHEETS.CANDIDATS);

  const lignes = construireTableauCandidats(joueurs, creneaux, config);

  ecrireTableau(feuille, lignes);

  feuille.autoResizeColumns(1, lignes[0].length);

  feuille.setFrozenRows(1);

  return feuille;
}
