/**
 * ===========================================================
 * models/resultat.gs
 * ===========================================================
 */

/**
 * @typedef {Object} ResultatRepartition
 *
 * @property {Creneau[]} creneaux
 * @property {Joueur[]} sansSolution
 * @property {Object[]} historique
 */

function creerResultat() {
  return {
    creneaux: [],
    sansSolution: [],
    historique: [],
  };
}
