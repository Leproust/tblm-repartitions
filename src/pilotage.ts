/**
 * ===========================================================
 * pilotage.gs
 *
 * Fonctions métier de pilotage de la répartition
 *
 * - Occupation des créneaux
 * - Joueurs sans affectation
 * - Validation / verrouillage
 *
 * ===========================================================
 */

/**
 * ===========================================================
 * OCCUPATION DES CRENEAUX
 *
 * Retourne les places disponibles
 * et les éventuels surbookings
 *
 * ===========================================================
 */
function analyserOccupationCreneaux(creneaux) {
  if (!creneaux) {
    return [];
  }

  return creneaux.map((c) => {
    const joueurs = c.joueurs || [];

    const effectif = joueurs.length;

    const capacite = Number(c.effectif) || 0;

    return {
      creneau: c.nom || c.creneau,

      jour: c.jour || "",

      heure: c.heure || "",

      categorie: c.categorie || "",

      capacite,

      inscrits: effectif,

      placesDisponibles: Math.max(0, capacite - effectif),

      surbooking: Math.max(0, effectif - capacite),
    };
  });
}

/**
 * ===========================================================
 * EXPORT OCCUPATION
 *
 * Création onglet Capacites
 *
 * ===========================================================
 */
function exporterOccupation() {
  const contexte = chargerContexte();

  const occupation = analyserOccupationCreneaux(contexte.creneaux);

  const donnees = [
    [
      "Créneau",
      "Jour",
      "Heure",
      "Catégorie",
      "Capacité",
      "Inscrits",
      "Places disponibles",
      "Surbooking",
    ],
  ];

  occupation.forEach((c) => {
    donnees.push([
      c.creneau,

      c.jour,

      c.heure,

      c.categorie,

      c.capacite,

      c.inscrits,

      c.placesDisponibles,

      c.surbooking,
    ]);
  });

  const feuille = obtenirOuCreerFeuille("Capacites");

  feuille.clear();

  ecrireTableau(feuille, donnees);
}

/**
 * ===========================================================
 * JOUEURS SANS CRENEAU
 *
 * ===========================================================
 */
function trouverJoueursSansCreneau(joueurs) {
  if (!joueurs) {
    return [];
  }

  return joueurs.filter((j) => {
    return !j.creneau && !j.affectation;
  });
}

/**
 * ===========================================================
 * EXPORT JOUEURS SANS CRENEAU
 *
 * ===========================================================
 */
function exporterJoueursSansCreneau() {
  const contexte = chargerContexte();

  const joueurs = trouverJoueursSansCreneau(contexte.joueurs);

  const donnees = [
    ["Nom", "Prénom", "Catégorie", "Classement", "Voeu 1", "Voeu 2", "Voeu 3"],
  ];

  joueurs.forEach((j) => {
    donnees.push([
      j.nom,

      j.prenom,

      j.categorie,

      j.classement,

      j.voeux ? j.voeux[0] : "",

      j.voeux ? j.voeux[1] : "",

      j.voeux ? j.voeux[2] : "",
    ]);
  });

  const feuille = obtenirOuCreerFeuille("Sans créneau");

  feuille.clear();

  ecrireTableau(feuille, donnees);
}

/**
 * ===========================================================
 * VERROUILLAGE JOUEUR
 *
 * Permet de dire :
 * ce joueur ne doit plus bouger
 *
 * ===========================================================
 */
function verrouillerJoueur(joueur) {
  joueur.verrouille = true;
}

/**
 * ===========================================================
 * DEVERROUILLAGE JOUEUR
 *
 * ===========================================================
 */
function deverrouillerJoueur(joueur) {
  joueur.verrouille = false;
}

/**
 * ===========================================================
 * VERIFIER SI JOUEUR EST BLOQUE
 *
 * ===========================================================
 */
function estVerrouille(joueur) {
  return joueur && joueur.verrouille === true;
}

/**
 * ===========================================================
 * FILTRER JOUEURS LIBRES
 *
 * Utilisé par optimisation
 *
 * ===========================================================
 */
function joueursRecalculables(joueurs) {
  return joueurs.filter((j) => !estVerrouille(j));
}

/**
 * ===========================================================
 * STATUT D'UN GROUPE
 *
 * Pour évolution future :
 * validation manuelle depuis feuille Groupes
 *
 * ===========================================================
 */
function groupeEstValide(groupe) {
  return groupe && groupe.valide === true;
}
