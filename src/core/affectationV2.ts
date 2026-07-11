/**
 * ===========================================================
 * affectationV2.gs
 *
 * Nouveau moteur d'affectation
 *
 * Contraintes d'abord
 * Score ensuite
 *
 * ===========================================================
 */

/**
 * ===========================================================
 * POINT D'ENTREE
 * ===========================================================
 */
function lancerAffectationV2() {
  const contexte = chargerContexte();

  const joueurs = contexte.joueurs;

  const creneaux = initialiserGroupesV2(contexte.creneaux);

  journalInfo("AFFECTATION V2", "Joueurs", joueurs.length);

  preparerPriorites(joueurs, creneaux, contexte.config);

  const joueursTries = trierParPriorite(joueurs);

  const sansSolution = [];

  joueursTries.forEach((joueur) => {
    const affecte = affecterUnJoueurV2(joueur, creneaux, contexte.config);

    if (!affecte) {
      sansSolution.push(joueur);
    }
  });

  journalInfo("AFFECTATION V2", "Sans solution", sansSolution.length);

  exporterSansSolution(sansSolution);

  return {
    creneaux,

    sansSolution,
  };
}

/**
 * ===========================================================
 * API appelée par main.gs
 *
 * Compatible avec le pilotage existant
 * ===========================================================
 */
function affecterJoueursV2(joueurs, creneaux, config) {
  journalInfo("AFFECTATION V2", "Début", joueurs.length + " joueurs");

  /*
    Préparation des groupes
  */

  creneaux = initialiserGroupesV2(creneaux);

  /*
    Calcul des priorités
  */

  preparerPriorites(joueurs, creneaux, config);

  /*
    Tri des cas difficiles
  */

  const joueursTries = trierParPriorite(joueurs);

  const sansSolution = [];

  joueursTries.forEach((joueur) => {
    if (estVerrouille(joueur)) {
      return;
    }

    const ok = affecterUnJoueurV2(joueur, creneaux, config);

    if (!ok) {
      sansSolution.push(joueur);
    }
  });

  journalInfo("AFFECTATION V2", "Sans solution", sansSolution.length);

  return {
    creneaux: creneaux,

    sansSolution: sansSolution,
  };
}

/**
 * ===========================================================
 * INITIALISATION GROUPES
 * ===========================================================
 */
function initialiserGroupesV2(creneaux) {
  return creneaux.map((c) => {
    c.joueurs = c.joueurs || [];

    return c;
  });
}

/**
 * ===========================================================
 * AFFECTER UN JOUEUR
 * ===========================================================
 */
function affecterUnJoueurV2(joueur, creneaux, config) {
  /*
    Recherche des créneaux autorisés
    (passage strict : compétition respectée)
  */

  let possibles = creneauxPossibles(joueur, creneaux);

  let enRepli = false;

  /*
    Repli : si AUCUNE place n'existe en respectant
    strictement la compétition, on retente en l'ignorant
    (mélange compétition/non-compétition en dernier recours).
    Homme/Femme adulte, lui, n'a jamais de repli : ce
    mélange reste toujours manuel.
  */

  if (possibles.length === 0) {
    const repli = creneauxPossibles(joueur, creneaux, {
      ignorerCompetition: true,
    });

    if (repli.length > 0) {
      possibles = repli;

      enRepli = true;
    }
  }

  if (possibles.length === 0) {
    journalInfo(
      "AFFECTATION",
      "Aucun créneau",
      joueur.nom + " " + joueur.prenom,
    );

    return false;
  }

  /*
    Classement des candidats
  */

  const options = enRepli ? { ignorerCompetition: true } : undefined;

  const candidats = possibles.map((c) => {
    return {
      creneau: c,

      score: calculerScoreV2(joueur, c, config, options),
    };
  });

  candidats.sort((a, b) => b.score - a.score);

  const meilleur = candidats[0];

  if (!meilleur || meilleur.score < -100000) {
    return false;
  }

  /*
    Affectation finale
  */

  meilleur.creneau.joueurs.push(joueur);

  joueur.affectation = meilleur.creneau.nom;

  joueur.repliCompetition = enRepli;

  if (enRepli) {
    journalInfo(
      "AFFECTATION",
      "Repli compétition (aucune place compatible)",
      joueur.nom + " " + joueur.prenom + " -> " + meilleur.creneau.nom,
    );
  }

  journalInfo(
    "AFFECTATION",
    joueur.nom + " " + joueur.prenom,
    meilleur.creneau.nom,
  );

  return true;
}

/**
 * ===========================================================
 * EXPORT SANS SOLUTION
 * ===========================================================
 */
function exporterSansSolution(joueurs) {
  const donnees = [["Nom", "Prénom", "Catégorie", "Voeux", "Priorité"]];

  joueurs.forEach((j) => {
    donnees.push([
      j.nom,

      j.prenom,

      j.categorie,

      j.voeux ? j.voeux.join(", ") : "",

      j.priorite || "",
    ]);
  });

  const feuille = obtenirOuCreerFeuille("Sans solution");

  feuille.clear();

  ecrireTableau(feuille, donnees);
}
