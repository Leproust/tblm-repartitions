/**
 * ===========================================================
 * contraintes.gs
 *
 * Toutes les contraintes métier de l'école de tennis.
 *
 * Une contrainte renvoie TRUE si le joueur peut être placé
 * sur le créneau, FALSE sinon.
 *
 * Les contraintes sont BLOQUANTES.
 *
 * ===========================================================
 */

/**
 * Fonction principale
 */
function affectationPossible(joueur, creneau) {
  return (
    creneauActif(creneau) &&
    categorieCompatible(joueur, creneau) &&
    voeuCompatible(joueur, creneau) &&
    competitionCompatible(joueur, creneau) &&
    capaciteDisponible(creneau) &&
    ageCompatible(joueur, creneau)
  );
}

/**
 * -----------------------------------------------------------
 * Créneau actif
 *
 * Par défaut (champ absent/undefined), un créneau est actif.
 * Il ne devient inactif que si `actif` vaut explicitement false.
 * -----------------------------------------------------------
 */
function creneauActif(creneau) {
  return creneau.actif !== false;
}

/**
 * -----------------------------------------------------------
 * Capacité
 * -----------------------------------------------------------
 */
function capaciteCreneau(creneau) {
  const effectif = Number(creneau && (creneau.effectif ?? creneau.capacite));

  return Number.isFinite(effectif) ? effectif : 0;
}

function capaciteDisponible(creneau) {
  const effectif = creneau.joueurs.length;

  return effectif < capaciteCreneau(creneau) + Number(creneau.surbooking || 0);
}

/**
 * -----------------------------------------------------------
 * Catégorie
 * -----------------------------------------------------------
 */
function categorieCompatible(joueur, creneau) {
  /*
      Catégorie identique
  */

  if (joueur.categorie === creneau.categorie) {
    return true;
  }

  /*
      Adultes
      -> jamais de mélange
  */

  if (joueur.categorie === CATEGORIES.HOMME_ADULTE || joueur.categorie === CATEGORIES.FEMME) {
    return false;
  }

  /*
      BABY
  */

  if (joueur.categorie === CATEGORIES.BABY) {
    return creneau.categorie === CATEGORIES.BABY;
  }

  /*
      Primaire / College
      peuvent éventuellement
      se mélanger.
  */

  if (joueur.categorie === CATEGORIES.PRIMAIRE) {
    return creneau.categorie === CATEGORIES.PRIMAIRE || creneau.categorie === CATEGORIES.COLLEGE;
  }

  if (joueur.categorie === CATEGORIES.COLLEGE) {
    return creneau.categorie === CATEGORIES.COLLEGE || creneau.categorie === CATEGORIES.PRIMAIRE;
  }

  return false;
}

/**
 * -----------------------------------------------------------
 * Compatibilité voeux
 * -----------------------------------------------------------
 */
function voeuCompatible(joueur, creneau) {
  /*
      Adultes :
      si des voeux sont renseignés, on les respecte.
      sinon on laisse la place à tout créneau valide.
  */

  if (joueur.categorie === CATEGORIES.HOMME_ADULTE || joueur.categorie === CATEGORIES.FEMME) {
    if (!joueur.voeux || joueur.voeux.length === 0) {
      return true;
    }

    return joueur.voeux.includes(creneau.nom);
  }

  /*
      Jeunes :
      on autorise les autres créneaux de la catégorie.
  */

  return true;
}

/**
 * -----------------------------------------------------------
 * Compatibilité compétition adultes
 * -----------------------------------------------------------
 */
function competitionCompatible(joueur, creneau) {
  if (estJeune(joueur)) {
    return true;
  }

  if (!joueur.competition) {
    return creneau.joueurs.every((j) => j.competition !== true);
  }

  return creneau.joueurs.every((j) => j.competition === true);
}

/**
 * -----------------------------------------------------------
 * Compatibilité âge
 * -----------------------------------------------------------
 */
function ageCompatible(joueur, creneau) {
  if (!estJeune(joueur)) return true;

  if (creneau.joueurs.length === 0) {
    return true;
  }

  const ageMoyen = moyenne(creneau.joueurs, (j) => j.age);

  const ecart = Math.abs(joueur.age - ageMoyen);

  switch (joueur.categorie) {
    case CATEGORIES.BABY:
      return ecart <= 1;

    case CATEGORIES.PRIMAIRE:
      return ecart <= 2;

    case CATEGORIES.COLLEGE:
      return ecart <= 3;
  }

  return true;
}

/**
 * -----------------------------------------------------------
 * Retourne les créneaux autorisés
 * -----------------------------------------------------------
 */
function creneauxPossibles(joueur, creneaux) {
  return creneaux.filter((c) => affectationPossible(joueur, c));
}

/**
 * -----------------------------------------------------------
 * Vérifie si un groupe est complet
 * -----------------------------------------------------------
 */
function groupeComplet(groupe) {
  return groupe.joueurs.length >= capaciteCreneau(groupe);
}

/**
 * -----------------------------------------------------------
 * Vérifie si le groupe est
 * en surbooking
 * -----------------------------------------------------------
 */
function groupeEnSurbooking(groupe) {
  return groupe.joueurs.length > capaciteCreneau(groupe);
}

/**
 * -----------------------------------------------------------
 * Nombre de places restantes
 * -----------------------------------------------------------
 */
function placesDisponibles(groupe) {
  return capaciteCreneau(groupe) + Number(groupe.surbooking || 0) - groupe.joueurs.length;
}
