/**
 * ===========================================================
 * classement.gs
 *
 * Gestion des classements FFT
 *
 * Objectif :
 * Transformer un classement texte FFT en valeur numérique
 * exploitable par le moteur de score.
 *
 * Plus la valeur est élevée :
 * plus le joueur est fort.
 *
 * ===========================================================
 */


/**
 * Table officielle simplifiée FFT
 *
 * La valeur permet de comparer deux joueurs.
 *
 * Exemple :
 *
 * NC     = 0
 * 40     = 1
 * 30/5   = 2
 * 30/2   = 5
 * 15     = 13
 *
 */
const TABLE_CLASSEMENT_FFT = {

  "NC":0,

  "40":1,

  "30/5":2,

  "30/4":3,

  "30/3":4,

  "30/2":5,

  "30/1":6,

  "30":7,

  "15/5":8,

  "15/4":9,

  "15/3":10,

  "15/2":11,

  "15/1":12,

  "15":13,

  "5/6":14,

  "4/6":15,

  "3/6":16,

  "2/6":17,

  "1/6":18,

  "0":19,

  "-2/6":20,

  "-4/6":21,

  "-15":22

};


/**
 * Convertit un classement FFT
 *
 * Entrée :
 *
 * "30/2"
 *
 * Sortie :
 *
 * 5
 *
 */
function convertirClassement(
  classement
){

  if(!classement)
    return 0;


  const propre =
    nettoyerClassement(
      classement
    )
    .toUpperCase();


  if(
    TABLE_CLASSEMENT_FFT[
      propre
    ]
    !==undefined
  ){

    return TABLE_CLASSEMENT_FFT[
      propre
    ];

  }


  return analyserClassementSpecial(
    propre
  );

}


/**
 * Analyse des cas particuliers
 *
 * Permet d'être robuste avec
 * des données Ten'Up ou Excel
 */
function analyserClassementSpecial(
  valeur
){

  if(valeur==="")
    return 0;


  /*
   Gestion classement écrit
   avec espaces
  */

  const clean =
    valeur
    .replace(/\s/g,"");


  if(
    TABLE_CLASSEMENT_FFT[
      clean
    ]!==undefined
  ){

    return TABLE_CLASSEMENT_FFT[
      clean
    ];

  }


  /*
    Classements négatifs
  */

  if(
    clean.startsWith("-")
  ){

    const nombre =
      Number(
        clean
        .replace("/6","")
      );


    if(!isNaN(nombre))
      return 20 + Math.abs(nombre);

  }


  /*
    Par sécurité :
    classement inconnu
  */

  Logger.log(
    "Classement inconnu : "
    +
    valeur
  );


  return 0;

}


/**
 * Ajoute le niveau numérique
 * à tous les joueurs
 */
function enrichirNiveau(
  joueurs
){

  joueurs.forEach(
    joueur=>{

      joueur.niveau =
        convertirClassement(
          joueur.classement
        );

    }
  );


  return joueurs;

}


/**
 * Compare deux joueurs
 *
 * Retour :
 *
 * positif :
 * joueur A plus fort
 *
 * négatif :
 * joueur B plus fort
 */
function comparerNiveau(
  joueurA,
  joueurB
){

  return
    joueurA.niveau
    -
    joueurB.niveau;

}


/**
 * Retourne l'écart
 * entre deux joueurs
 */
function ecartNiveau(
  joueurA,
  joueurB
){

  return Math.abs(

    joueurA.niveau
    -
    joueurB.niveau

  );

}


/**
 * Niveau moyen d'un groupe
 */
function niveauMoyen(
  joueurs
){

  return moyenne(
    joueurs,
    j=>j.niveau
  );

}


/**
 * Ecart de niveau
 *
 * Plus le résultat est faible
 * plus le groupe est homogène
 */
function dispersionNiveau(
  joueurs
){

  return ecartType(
    joueurs,
    j=>j.niveau
  );

}


/**
 * Retourne un libellé
 * depuis une valeur numérique
 */
function libelleClassement(
  niveau
){

  const entree =
    Object.entries(
      TABLE_CLASSEMENT_FFT
    )
    .find(
      ([nom,valeur]) =>
        valeur===niveau
    );


  return entree
    ?
    entree[0]
    :
    "NC";

}


/**
 * Vérifie si deux joueurs
 * ont un niveau compatible
 *
 * Utilisé plus tard
 * dans le score
 */
function niveauCompatible(
  joueurA,
  joueurB,
  ecartMax
){

  return (
    ecartNiveau(
      joueurA,
      joueurB
    )
    <=
    ecartMax
  );

}


/**
 * Retourne une pénalité
 * selon l'écart de niveau
 *
 * Utilisé dans score.gs
 */
function penaliteNiveau(
  joueurA,
  joueurB
){

  const ecart =
    ecartNiveau(
      joueurA,
      joueurB
    );


  /*
    même niveau
  */
  if(ecart===0)
    return 0;


  /*
    1 classement d'écart
  */
  if(ecart===1)
    return 5;


  /*
    2 classements
  */
  if(ecart===2)
    return 20;


  /*
    grand écart
  */
  return 50 + ecart*10;

}


/**
 * Classement minimum
 * d'un groupe
 */
function niveauMinimum(
  joueurs
){

  if(!joueurs.length)
    return 0;


  return Math.min(
    ...joueurs.map(
      j=>j.niveau
    )
  );

}


/**
 * Classement maximum
 * d'un groupe
 */
function niveauMaximum(
  joueurs
){

  if(!joueurs.length)
    return 0;


  return Math.max(
    ...joueurs.map(
      j=>j.niveau
    )
  );

}
