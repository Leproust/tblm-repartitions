 /**
 * ===========================================================
 * score.gs
 *
 * Moteur de calcul des scores
 *
 * Le principe :
 *
 * Un joueur + un créneau = un score
 *
 * Un groupe = un score global
 *
 * Plus le score est élevé,
 * meilleure est la répartition.
 *
 * ===========================================================
 */


/**
 * Poids par défaut
 *
 * Ces valeurs seront ensuite
 * remplacées par la feuille Config
 */
const POIDS_DEFAUT = {

  VOEU:100,

  NIVEAU:90,

  AGE:80,

  CATEGORIE:90,

  SEXE:15,

  NOUVEAU:10

};


/**
 * Charge les poids depuis Config
 */
function obtenirPoids(config){

  config = config || {};

  return {

    VOEU:
      100,

    NIVEAU:
      lireNombre(
        config["Poids niveau"]
      )
      ||
      POIDS_DEFAUT.NIVEAU,


    AGE:
      lireNombre(
        config["Poids age"]
      )
      ||
      POIDS_DEFAUT.AGE,


    CATEGORIE:
      lireNombre(
        config["Poids catégorie"]
      )
      ||
      POIDS_DEFAUT.CATEGORIE,


    SEXE:
      lireNombre(
        config["Poids sexe"]
      )
      ||
      POIDS_DEFAUT.SEXE,


    NOUVEAU:
      POIDS_DEFAUT.NOUVEAU

  };

}


/**
 * ===========================================================
 * SCORE JOUEUR -> CRENEAU
 * ===========================================================
 *
 * Détermine si un créneau
 * convient à un joueur.
 *
 */
function calculerScoreAffectation(
  joueur,
  creneau,
  poids
){

  let score=0;


  /*
    1) Satisfaction du voeu
  */

  score +=
    scoreVoeu(
      joueur,
      creneau
    )
    *
    poids.VOEU;



  /*
    2) Catégorie
  */

  score +=
    scoreCategorie(
      joueur,
      creneau
    )
    *
    poids.CATEGORIE;



  /*
    3) Age
  */

  score +=
    scoreAge(
      joueur,
      creneau
    )
    *
    poids.AGE;



  /*
    4) Niveau
  */

  score +=
    scoreNiveau(
      joueur,
      creneau
    )
    *
    poids.NIVEAU;



  /*
    5) Sexe
  */

  score +=
    scoreSexe(
      joueur,
      creneau
    )
    *
    poids.SEXE;



  /*
    6) Nouveau adhérent
  */

  score +=
    scoreNouveau(
      joueur
    )
    *
    poids.NOUVEAU;


  return score;

}



/**
 * ===========================================================
 * VOEUX
 * ===========================================================
 *
 * Premier choix = 1
 * Deuxième choix = 0.8
 * etc.
 */
function scoreVoeu(
  joueur,
  creneau
){

  const nomCreneau =
    cleComparaisonCreneau(
      creneau.nom
    );

  const position =
    joueur.voeux
    .findIndex(
      (v) => cleComparaisonCreneau(v) === nomCreneau
    );


  if(position===-1)
    return 0;


  switch(position){

    case 0:
      return 1;

    case 1:
      return 0.8;

    case 2:
      return 0.6;

    case 3:
      return 0.4;

    case 4:
      return 0.2;

  }


  return 0;

}


/**
 * ===========================================================
 * CATEGORIE
 * ===========================================================
 */
function scoreCategorie(
  joueur,
  creneau
){

  if(
    joueur.categorie
    ===
    creneau.categorie
  )
    return 1;


  /*
    Cas jeunes :
    interdit
  */

  if(
    estJeune(
      joueur
    )
  )
    return -1;



  return 0;

}


/**
 * ===========================================================
 * AGE
 * ===========================================================
 *
 * La règle importante :
 *
 * BABY / Primaire / College
 *
 * => écart très pénalisant
 *
 * Adultes :
 * => presque ignoré
 *
 */
function scoreAge(
  joueur,
  creneau
){

  if(
    !estJeune(joueur)
  )
    return 1;


  /*
    Pour un créneau vide,
    pas encore de groupe
  */

  if(
    creneau.joueurs.length===0
  )
    return 1;



  const ageMoyen =
    moyenne(
      creneau.joueurs,
      j=>j.age
    );


  const ecart =
    Math.abs(
      joueur.age
      -
      ageMoyen
    );



  /*
    BABY
  */

  if(
    joueur.categorie===CATEGORIES.BABY
  ){

    if(ecart<=1)
      return 1;


    if(ecart<=2)
      return 0.5;


    return -1;

  }



  /*
    Primaire
  */

  if(
    joueur.categorie===CATEGORIES.PRIMAIRE
  ){

    if(ecart<=1)
      return 1;


    if(ecart<=2)
      return 0.6;


    if(ecart<=3)
      return 0.2;


    return -1;

  }



  /*
    College
  */

  if(
    joueur.categorie===CATEGORIES.COLLEGE
  ){

    if(ecart<=2)
      return 1;


    if(ecart<=3)
      return 0.5;


    return -1;

  }



  return 1;

}



/**
 * ===========================================================
 * NIVEAU
 * ===========================================================
 *
 * Favorise les groupes homogènes
 */
function scoreNiveau(
  joueur,
  creneau
){

  if(
    creneau.joueurs.length===0
  )
    return 1;



  const niveauMoy =
    niveauMoyen(
      creneau.joueurs
    );


  const ecart =
    Math.abs(
      joueur.niveau
      -
      niveauMoy
    );



  if(ecart===0)
    return 1;


  if(ecart<=2)
    return 0.8;


  if(ecart<=4)
    return 0.4;


  return 0;

}



/**
 * ===========================================================
 * SEXE
 * ===========================================================
 */
function scoreSexe(
  joueur,
  creneau
){

  if(
    creneau.joueurs.length===0
  )
    return 1;


  const femmes =
    creneau.joueurs
    .filter(
      j=>j.sexe==="F"
    )
    .length;


  const hommes =
    creneau.joueurs
    .filter(
      j=>j.sexe==="H"
    )
    .length;



  /*
    On évite les groupes
    totalement déséquilibrés
    uniquement pour les catégories mixtes
  */

  if(
    joueur.sexe==="F"
    &&
    femmes===0
  )
    return 0.5;


  if(
    joueur.sexe==="H"
    &&
    hommes===0
  )
    return 0.5;


  return 1;

}



/**
 * ===========================================================
 * NOUVEAUX
 * ===========================================================
 */
function scoreNouveau(
  joueur
){

  return joueur.nouveau
    ?
    1
    :
    0;

}



/**
 * ===========================================================
 * SCORE D'UN GROUPE
 * ===========================================================
 *
 * Le moteur d'optimisation
 * utilisera cette fonction.
 *
 */
function calculerScoreGroupe(
  groupe
){

  if(
    !groupe ||
    groupe.length===0
  )
    return 0;



  let score=100;



  /*
    Homogénéité âge
  */

  if(
    estJeune(
      groupe[0]
    )
  ){

    score -=
      ecartType(
        groupe,
        j=>j.age
      )
      *
      30;

  }



  /*
    Homogénéité niveau
  */

  score -=
    dispersionNiveau(
      groupe
    )
    *
    20;



  return score;

}