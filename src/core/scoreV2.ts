/**
 * ===========================================================
 * scoreV2.gs
 *
 * Nouveau moteur de score
 *
 * Principe :
 *
 * 1) Les contraintes éliminent les mauvais choix
 * 2) Le score choisit le meilleur parmi les choix possibles
 *
 * Plus le score est élevé,
 * meilleur est le créneau.
 *
 * ===========================================================
 */

/**
 * Poids V2
 *
 * Les contraintes sont déjà filtrées.
 */
const POIDS_SCORE_V2 = {
  VOEU: 1000,

  AGE: 300,

  NIVEAU: 180,

  COMPETITION: 150,

  EQUILIBRE: 100,

  REMPLISSAGE: 50,
};

function lirePoidsConfig(config) {
  const poids = { ...POIDS_SCORE_V2 };

  if (!config) return poids;

  if (typeof config["Poids niveau"] === "number") {
    poids.NIVEAU = config["Poids niveau"];
  }

  if (typeof config["Poids competition"] === "number") {
    poids.COMPETITION = config["Poids competition"];
  }

  if (typeof config["Poids age"] === "number") {
    poids.AGE = config["Poids age"];
  }

  if (typeof config["Poids sexe"] === "number") {
    poids.EQUILIBRE = config["Poids sexe"];
  }

  if (typeof config["Poids catégorie"] === "number") {
    poids.VOEU = config["Poids catégorie"];
  }

  return poids;
}

/**
 * ===========================================================
 * SCORE GLOBAL JOUEUR -> CRENEAU
 * ===========================================================
 */
function calculerScoreV2(joueur, creneau, config, options: { ignorerCompetition?: boolean } = {}) {
  /*
    Sécurité :
    un créneau interdit ne doit jamais passer
  */

  if (!affectationPossible(joueur, creneau, options)) {
    return -999999;
  }

  return calculerScoreV2Brut(joueur, creneau, config);
}

/**
 * Calcul brut, sans le garde-fou des contraintes.
 *
 * Utilisé pour évaluer un joueur déjà en place dans son
 * créneau (ex: recalcul du score total pendant l'optimisation).
 * Dans ce cas, capaciteDisponible() renverrait toujours false
 * pour un groupe déjà plein puisqu'il compte le joueur
 * lui-même : on ne veut donc pas appliquer le garde-fou ici,
 * seulement quand on évalue un NOUVEAU placement candidat.
 */
function calculerScoreV2Brut(joueur, creneau, config) {
  const poids = lirePoidsConfig(config);

  let score = 0;

  /*
    1) Satisfaction des voeux
  */

  score += scoreVoeuV2(joueur, creneau) * poids.VOEU;

  /*
    2) Age
  */

  score += scoreAgeV2(joueur, creneau) * poids.AGE;

  /*
    3) Niveau
  */

  score += scoreNiveauV2(joueur, creneau) * poids.NIVEAU;

  /*
    4) Compétition adultes
  */
  score += scoreCompetitionV2(joueur, creneau) * poids.COMPETITION;

  /*
    5) Equilibre groupe
  */

  score += scoreEquilibreV2(joueur, creneau) * poids.EQUILIBRE;

  /*
    5) Remplissage intelligent
  */

  score += scoreRemplissageV2(creneau) * poids.REMPLISSAGE;

  return score;
}

/**
 * ===========================================================
 * SCORE D'UN CRENEAU / DE LA REPARTITION COMPLETE
 *
 * Utilisé par l'optimisation pour comparer un état avant/après
 * (échange, déplacement) avec la même logique de score que
 * l'affectation initiale (un seul moteur, cf. calculerScoreV2Brut).
 * ===========================================================
 */
function scoreCreneauCompletV2(creneau, config) {
  let score = 0;

  creneau.joueurs.forEach((joueur) => {
    score += calculerScoreV2Brut(joueur, creneau, config);
  });

  return score;
}

function scoreAffectationTotaleV2(creneaux, config) {
  let score = 0;

  creneaux.forEach((c) => {
    score += scoreCreneauCompletV2(c, config);
  });

  return score;
}

/**
 * ===========================================================
 * SCORE DES VOEUX
 * ===========================================================
 */
function scoreVoeuV2(joueur, creneau) {
  if (!joueur.voeux) {
    return 0;
  }

  const nomCreneau = cleComparaisonTexte(creneau.nom);

  const index = joueur.voeux.findIndex((v) => cleComparaisonTexte(v) === nomCreneau);

  switch (index) {
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

    default:
      return 0;
  }
}

/**
 * ===========================================================
 * AGE
 *
 * Très important chez les jeunes
 * ===========================================================
 */
function scoreAgeV2(joueur, creneau) {
  if (!estJeune(joueur)) {
    return 1;
  }

  if (creneau.joueurs.length === 0) {
    return 1;
  }

  const ageMoyen = moyenne(creneau.joueurs, (j) => j.age);

  const ecart = Math.abs(joueur.age - ageMoyen);

  switch (joueur.categorie) {
    case CATEGORIES.BABY:
      if (ecart <= 1) return 1;

      if (ecart <= 2) return 0.5;

      return 0;

    case CATEGORIES.PRIMAIRE:
      if (ecart <= 1) return 1;

      if (ecart <= 2) return 0.7;

      if (ecart <= 3) return 0.3;

      return 0;

    case CATEGORIES.COLLEGE:
      if (ecart <= 2) return 1;

      if (ecart <= 3) return 0.5;

      return 0;
  }

  return 1;
}

/**
 * ===========================================================
 * NIVEAU
 * ===========================================================
 */
function scoreNiveauV2(joueur, creneau) {
  if (creneau.joueurs.length === 0) {
    return 1;
  }

  const niveauMoyen = moyenne(creneau.joueurs, (j) => j.niveau);

  const ecart = Math.abs(joueur.niveau - niveauMoyen);

  if (estJeune(joueur)) {
    if (ecart <= 2) return 1;
    if (ecart <= 4) return 0.6;
    return 0;
  }

  if (joueur.competition) {
    if (ecart <= 1) return 1;
    if (ecart <= 2) return 0.9;
    if (ecart <= 3) return 0.6;
    if (ecart <= 4) return 0.3;
    return 0;
  }

  if (ecart <= 2) return 1;
  if (ecart <= 4) return 0.7;
  if (ecart <= 6) return 0.4;
  return 0;
}

function scoreCompetitionV2(joueur, creneau) {
  if (estJeune(joueur) || !joueur.competition) {
    return 0;
  }

  if (creneau.joueurs.length === 0) {
    return 0.5;
  }

  const niveauMoyen = moyenne(creneau.joueurs, (j) => j.niveau);

  const ecart = Math.abs(joueur.niveau - niveauMoyen);

  if (ecart <= 1) return 1;
  if (ecart <= 2) return 0.9;
  if (ecart <= 3) return 0.7;
  if (ecart <= 4) return 0.4;

  return 0;
}

/**
 * ===========================================================
 * EQUILIBRE
 * ===========================================================
 */
function scoreEquilibreV2(joueur, creneau) {
  if (creneau.joueurs.length === 0) {
    return 1;
  }

  const memeSexe = creneau.joueurs.filter((j) => j.sexe === joueur.sexe).length;

  const ratio = memeSexe / creneau.joueurs.length;

  /*
    Evite les groupes totalement déséquilibrés
  */

  if (ratio > 0.9) {
    return 0.2;
  }

  return 1;
}

/**
 * ===========================================================
 * REMPLISSAGE
 * Favorise les groupes qui peuvent être complétés
 * ===========================================================
 */
function scoreRemplissageV2(creneau) {
  const capacite = capaciteCreneau(creneau);

  if (!capacite) return 0;

  const taux = creneau.joueurs.length / capacite;

  if (taux < 0.5) return 1;

  if (taux < 1) return 0.7;

  return 0.2;
}
