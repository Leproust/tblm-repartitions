const SHEETS = {
  LICENCIES: "Licencies",
  CRENEAUX: "Creneaux",
  CONFIG: "Config",
  GROUPES: "Groupes",
  STATS: "Statistiques",
};

const VOEUX = ["1er Voeu", "2eme Voeu", "3eme Voeu", "4eme Voeu", "5eme Voeu"];

const CATEGORIES = {
  BABY: "BABY",
  PRIMAIRE: "Primaire",
  COLLEGE: "College",
  FEMME: "Femme",
  HOMME: "Homme adulte",
};

const CONFIG = {
  POIDS_NIVEAU: "Poids niveau",
  POIDS_AGE: "Poids age",
  POIDS_SEXE: "Poids sexe",
  POIDS_CATEGORIE: "Poids catégorie",
  PRIORITE_NOUVEAUX: "Priorite nouveaux",
};

const CATEGORIES_JEUNES = ["BABY", "Primaire", "College"];

const LIMITES_AGE_GROUPES = {
  BABY: 1,
  Primaire: 2,
  College: 3,
};

/**
 * ===========================================================
 * ORDRE DES CLASSEMENTS FFT
 *
 * Plus la valeur est élevée,
 * plus le niveau est fort
 *
 * ===========================================================
 */

const CLASSEMENTS_FFT = {
  NC: 0,

  40: 1,

  "40/5": 2,
  "40/4": 3,
  "40/3": 4,
  "40/2": 5,
  "40/1": 6,

  "30/5": 7,
  "30/4": 8,
  "30/3": 9,
  "30/2": 10,
  "30/1": 11,

  30: 12,

  "15/5": 13,
  "15/4": 14,
  "15/3": 15,
  "15/2": 16,
  "15/1": 17,

  "5/6": 18,
  "4/6": 19,
  "3/6": 20,
  "2/6": 21,
  "1/6": 22,

  0: 23,
};
