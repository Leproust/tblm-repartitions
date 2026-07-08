/**
 * ===========================================================
 * models/configuration.gs
 * ===========================================================
 */

/**
 * @typedef {Object} Configuration
 *
 * @property {number} poidsNiveau
 * @property {number} poidsAge
 * @property {number} poidsSexe
 * @property {number} poidsCategorie
 * @property {boolean} prioriteNouveaux
 */

function creerConfiguration() {
  return {
    poidsNiveau: 90,
    poidsAge: 80,
    poidsSexe: 15,
    poidsCategorie: 90,
    prioriteNouveaux: false,
  };
}
