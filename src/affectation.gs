/**
 * ===========================================================
 * affectation.gs
 *
 * Moteur de première affectation
 *
 * Objectif :
 *
 * - Placer chaque joueur dans un créneau acceptable
 * - Respecter les capacités
 * - Maximiser la satisfaction des vœux
 * - Préparer le terrain pour l'optimiseur
 *
 * Cette étape n'est PAS l'optimisation finale.
 * Elle produit une solution initiale de qualité.
 *
 * ===========================================================
 */

/**
 * Point d'entrée principal
 */
function affecterJoueurs(joueurs, creneaux, config) {
  Logger.log("DEBUG affectation");
  journalDebug("AFFECTATION", "Début affectation", joueurs.length);
  Logger.log("joueurs = " + (joueurs ? joueurs.length : "undefined"));

  Logger.log("creneaux = " + (creneaux ? creneaux.length : "undefined"));

  Logger.log("config = " + JSON.stringify(config));

  if (!joueurs) throw new Error("Liste joueurs absente");

  if (!creneaux) throw new Error("Liste créneaux absente");

  const poids = obtenirPoids(config);

  /*
    On initialise les créneaux
  */

  reinitialiserCreneaux(creneaux);

  /*
    On calcule les niveaux
  */

  enrichirNiveau(joueurs);

  /*
    On trie les joueurs
    du plus difficile
    au plus facile
  */

  const ordre = trierJoueursAffectation(joueurs);

  ordre.forEach((joueur) => {
    const choix = trouverMeilleurCreneau(joueur, creneaux, poids);

    if (choix) {
      ajouterJoueurCreneau(joueur, choix);
    } else {
      Logger.log("Impossible de placer : " + joueur.nom + " " + joueur.prenom);
    }
  });

  journalInfo(
    "AFFECTATION",
    "Affectation terminée",
    joueurs.filter((j) => j.creneau).length,
  );

  return creneaux;
}

/**
 * ===========================================================
 * INITIALISATION
 * ===========================================================
 */
function reinitialiserCreneaux(creneaux) {
  creneaux.forEach((c) => {
    c.joueurs = [];
  });
}

/**
 * ===========================================================
 * ORDRE DES JOUEURS
 * ===========================================================
 *
 * Les joueurs difficiles
 * doivent être placés en premier.
 *
 * Priorité :
 *
 * 1) peu de vœux
 * 2) jeunes stricts
 * 3) compétition
 * 4) nouveaux
 *
 */
function trierJoueursAffectation(joueurs) {
  return [...joueurs].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    /*
          Nombre de possibilités
        */

    scoreA += (5 - a.voeux.length) * 20;

    scoreB += (5 - b.voeux.length) * 20;

    /*
          Jeunes
        */

    if (estJeune(a)) scoreA += 50;

    if (estJeune(b)) scoreB += 50;

    /*
          Compétition
        */

    if (a.competition) scoreA += 20;

    if (b.competition) scoreB += 20;

    /*
          Nouveau
        */

    if (a.nouveau) scoreA += 10;

    if (b.nouveau) scoreB += 10;

    return scoreB - scoreA;
  });
}

/**
 * ===========================================================
 * RECHERCHE DU MEILLEUR CRENEAU
 * ===========================================================
 */
function trouverMeilleurCreneau(joueur, creneaux, poids) {
  let meilleur = null;

  let meilleurScore = -Infinity;

  creneaux.forEach((creneau) => {
    if (!creneau.actif) return;

    /*
        Catégorie incompatible
      */

    if (!categorieCompatible(joueur, creneau)) return;

    /*
        Capacité dépassée
      */

    if (!placeDisponible(creneau)) return;

    const score = calculerScoreAffectation(joueur, creneau, poids);

    if (score > meilleurScore) {
      meilleurScore = score;

      meilleur = creneau;
    }
  });

  return meilleur;
}

/**
 * ===========================================================
 * COMPATIBILITE CATEGORIE
 * ===========================================================
 */
function categorieCompatible(joueur, creneau) {
  /*
    Créneau prévu pour
    la catégorie
  */

  if (joueur.categorie === creneau.categorie) return true;

  /*
    On refuse les mélanges
    jeunes.
    */

  if (estJeune(joueur)) return false;

  /*
    Adultes :
    possibilité de mélange
    plus tard configurable.
  */

  return true;
}

/**
 * ===========================================================
 * CAPACITE
 * ===========================================================
 */
function placeDisponible(creneau) {
  return creneau.joueurs.length < creneau.capacite + creneau.surbooking;
}

/**
 * ===========================================================
 * AJOUT JOUEUR
 * ===========================================================
 */
function ajouterJoueurCreneau(joueur, creneau) {
  creneau.joueurs.push(joueur);

  joueur.affectation = creneau.nom;
}

/**
 * ===========================================================
 * CONTROLE RESULTAT
 * ===========================================================
 */
function analyserAffectation(creneaux) {
  const resultat = {};

  creneaux.forEach((c) => {
    resultat[c.nom] = {
      effectif: c.joueurs.length,

      capacite: c.capacite,

      complet: c.joueurs.length >= c.capacite,

      joueurs: c.joueurs.map((j) => j.nom + " " + j.prenom),
    };
  });

  return resultat;
}

/**
 * ===========================================================
 * JOUEURS NON AFFECTES
 * ===========================================================
 */
function joueursNonAffectes(joueurs) {
  return joueurs.filter((j) => !j.affectation);
}

/**
 * ===========================================================
 * SCORE TOTAL INITIAL
 * ===========================================================
 */
function scoreAffectationTotale(creneaux) {
  let score = 0;

  creneaux.forEach((c) => {
    score += calculerScoreGroupe(c.joueurs);
  });

  return score;
}
