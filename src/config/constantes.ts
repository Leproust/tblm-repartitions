/**
 * ===========================================================
 * constantes.gs
 *
 * Référentiel métier du moteur de répartition
 *
 * Aucun accès Google Sheet ici.
 * Aucun traitement ici.
 *
 * Uniquement :
 * - règles
 * - valeurs de référence
 * - paramètres par défaut
 *
 * ===========================================================
 */


/**
 * ===========================================================
 * CATEGORIES JOUEURS
 * ===========================================================
 */

var SHEETS = {
  LICENCIES: "Licencies",
  CRENEAUX: "Creneaux",
  CONFIG: "Config",
  GROUPES: "Groupes",
  CAPACITES: "Capacites",
  STATISTIQUES: "Statistiques",
  SANS_SOLUTION: "Sans solution",
  SANS_CRENEAU: "Sans créneau",
  RAPPORT: "Rapport",
};

var VOEUX = [
  "Voeu 1",
  "Voeu 2",
  "Voeu 3",
  "Voeu 4",
  "Voeu 5",
];

const CATEGORIES = {

  BABY: "BABY",

  PRIMAIRE: "Primaire",

  COLLEGE: "College",

  FEMME: "Femme",

  HOMME_ADULTE: "Homme adulte"

};



/**
 * ===========================================================
 * TYPE DE PUBLIC
 *
 * Utilisé pour les contraintes
 * ===========================================================
 */

const TYPE_PUBLIC = {

  JEUNE: "JEUNE",

  ADULTE: "ADULTE"

};



/**
 * ===========================================================
 * ORDRE DE PRIORITE DES JOUEURS
 *
 * Plus haut = traité en premier
 *
 * Les cas difficiles passent avant.
 *
 * ===========================================================
 */

const PRIORITE = {


  ADULTE:
    100,


  BABY:
    90,


  PRIMAIRE:
    80,


  COLLEGE:
    70

};



/**
 * ===========================================================
 * LIMITES GROUPES JEUNES
 * ===========================================================
 */

const LIMITES_AGE = {


  BABY: {

    ecartMax:1

  },


  Primaire: {

    ecartMax:2

  },


  College: {

    ecartMax:3

  }


};



/**
 * ===========================================================
 * POIDS DU SCORE
 *
 * Le score intervient uniquement
 * après validation des contraintes.
 *
 * ===========================================================
 */

const POIDS_SCORE = {


  VOEU:
    1000,


  CATEGORIE:
    500,


  AGE:
    300,


  NIVEAU:
    200,


  EQUILIBRE:
    100,


  REMPLISSAGE:
    50

};



/**
 * ===========================================================
 * VALEUR DES VOEUX
 *
 * Position dans la liste
 *
 * ===========================================================
 */

const VALEUR_VOEU = [

  1,

  0.8,

  0.6,

  0.4,

  0.2

];



/**
 * ===========================================================
 * CLASSEMENT FFT
 *
 * Valeur numérique interne.
 *
 * Sert uniquement aux calculs.
 *
 * ===========================================================
 */

const CLASSEMENT_FFT = {


  "NC":1000,


  "40":900,


  "30/5":800,

  "30/4":700,

  "30/3":600,

  "30/2":500,

  "30/1":400,

  "30":300,


  "15/5":250,

  "15/4":220,

  "15/3":190,

  "15/2":160,

  "15/1":130,

  "15":100,


  "5/6":90,

  "4/6":80,

  "3/6":70,

  "2/6":60,

  "1/6":50,

  "0":40,


  /*
    Classements jeunes rencontrés
  */

  "40/4":950,

  "40/3":925,

  "40/2":875,

  "40/1":850

};



/**
 * ===========================================================
 * OPTIMISATION
 * ===========================================================
 */

const OPTIMISATION = {


  iterations:100,


  conserverAmelioration:true,


  autoriserEchange:false,


  autoriserDeplacement:true

};



/**
 * ===========================================================
 * ETATS INTERNES
 * ===========================================================
 */

const ETAT_JOUEUR = {


  LIBRE:
    "LIBRE",


  AFFECTE:
    "AFFECTE",


  VERROUILLE:
    "VERROUILLE",


  IMPOSSIBLE:
    "IMPOSSIBLE"

};



/**
 * ===========================================================
 * MODE DE REPARTITION
 *
 * STRICT = uniquement règles fortes
 *
 * ELARGI = tentative de secours
 *
 * ===========================================================
 */

const MODE_REPARTITION = {


  STRICT:
    true,


  ELARGI:
    false

};