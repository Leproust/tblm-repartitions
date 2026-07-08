/**
 * Compatibilité avec l'ancien point d'entrée.
 * Le moteur courant utilisé par l'application est la version V2.
 */
function affecterJoueurs(joueurs, creneaux, config) {
  const resultat = affecterJoueursV2(joueurs, creneaux, config);

  return resultat.creneaux;
}

/**
 * ===========================================================
 * SCORE TOTAL INITIAL
 * ===========================================================
 */
function scoreAffectationTotale(creneaux) {
  let score = 0;

  const poids = POIDS_DEFAUT;

  creneaux.forEach((c) => {
    /*
        1) Qualité du groupe
      */

    score += calculerScoreGroupe(c.joueurs) * 10;

    /*
        2) Satisfaction joueurs
      */

    c.joueurs.forEach((joueur) => {
      score += calculerScoreAffectation(joueur, c, poids);
    });
  });

  return score;
}
