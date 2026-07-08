/**
 * ===========================================================
 * priorites.gs
 *
 * Calcul de priorité des joueurs
 *
 * Les joueurs avec la priorité la plus haute
 * sont affectés en premier.
 *
 * ===========================================================
 */

/**
 * Point d'entrée
 */
function calculerPrioriteJoueur(joueur, creneaux, config) {
  let priorite = 0;

  /*
   * 1) Nombre de voeux
   *
   * Moins il y a de choix,
   * plus le joueur est prioritaire.
   */

  const nbVoeux = compterVoeux(joueur);

  if (nbVoeux === 0) {
    priorite += 100;
  } else if (nbVoeux === 1) {
    priorite += 90;
  } else if (nbVoeux === 2) {
    priorite += 70;
  } else if (nbVoeux === 3) {
    priorite += 50;
  } else {
    priorite += 20;
  }

  /*
   * 2) Catégorie
   *
   * Les adultes sont difficiles
   * car ils ont des contraintes fortes.
   */

  switch (joueur.categorie) {
    case "Homme adulte":
      priorite += 50;
      break;

    case "Femme":
      priorite += 50;
      break;

    case "BABY":
      priorite += 40;
      break;

    case "Primaire":
      priorite += 30;
      break;

    case "College":
      priorite += 20;
      break;
  }

  /*
   * 3) Nouveaux adhérents
   */

  if (joueur.nouveau === true) {
    const prioriteNouveaux = lireValeurConfigBoolean(config, "Priorite nouveaux");
    priorite += prioriteNouveaux ? 10 : 0;
  }

  /*
   * 4) Peu de créneaux possibles
   *
   * Plus important que le nombre de voeux.
   */

  const possibles = creneauxPossibles(joueur, creneaux);

  if (possibles.length === 1) {
    priorite += 100;
  } else if (possibles.length === 2) {
    priorite += 60;
  } else if (possibles.length === 3) {
    priorite += 30;
  }

  /*
   * 5) Jeunes :
   *
   * l'âge est une contrainte forte.
   */

  if (estJeune(joueur)) {
    priorite += 20;
  }

  return priorite;
}

/**
 * ===========================================================
 * Compter les voeux réels
 * ===========================================================
 */
function compterVoeux(joueur) {
  if (!joueur.voeux) {
    return 0;
  }

  return joueur.voeux.filter((v) => v && v.trim() !== "").length;
}

/**
 * ===========================================================
 * Ajout de la priorité dans les joueurs
 * ===========================================================
 */
function preparerPriorites(joueurs, creneaux, config) {
  joueurs.forEach((joueur) => {
    joueur.priorite = calculerPrioriteJoueur(joueur, creneaux, config);
  });

  return joueurs;
}

/**
 * ===========================================================
 * Tri des joueurs
 *
 * Plus haute priorité en premier
 * ===========================================================
 */
function trierParPriorite(joueurs) {
  return joueurs.sort((a, b) => {
    return b.priorite - a.priorite;
  });
}

/**
 * ===========================================================
 * Diagnostic
 * ===========================================================
 */
function lireValeurConfigBoolean(config, cle) {
  if (!config || !config[cle]) return false;

  const valeur = String(config[cle]).trim().toLowerCase();

  return ["oui", "true", "1", "x", "yes"].includes(valeur);
}

function afficherPriorites() {
  const contexte = chargerContexte();

  const joueurs = preparerPriorites(contexte.joueurs, contexte.creneaux, contexte.config);

  const tries = trierParPriorite(joueurs);

  tries.slice(0, 20).forEach((j) => {
    Logger.log(j.nom + " " + j.prenom + " : " + j.priorite);
  });
}
