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
 * SCORE D'UN SEUL CRENEAU
 * ===========================================================
 *
 * Qualité du groupe + satisfaction de chacun des joueurs qui
 * s'y trouvent. Isolée dans sa propre fonction pour pouvoir
 * recalculer uniquement les créneaux impactés par un changement
 * (échange, déplacement) plutôt que la répartition entière.
 */
function scoreCreneauComplet(creneau, poids) {
  let score = calculerScoreGroupe(creneau.joueurs) * 10;

  creneau.joueurs.forEach((joueur) => {
    score += calculerScoreAffectation(joueur, creneau, poids);
  });

  return score;
}

/**
 * ===========================================================
 * SCORE TOTAL INITIAL
 * ===========================================================
 *
 * `config` permet de respecter les poids personnalisés
 * définis dans la feuille Config (mêmes poids que ceux
 * utilisés lors de l'affectation initiale). Si absente,
 * on retombe sur les poids par défaut.
 */
function scoreAffectationTotale(creneaux, config) {
  const poids = obtenirPoids(config);

  let score = 0;

  creneaux.forEach((c) => {
    score += scoreCreneauComplet(c, poids);
  });

  return score;
}
