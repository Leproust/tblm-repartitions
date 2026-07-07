/**
 * ===========================================================
 * optimisation.gs
 *
 * Optimisation de la répartition
 *
 * Principe :
 *
 * On part d'une solution initiale
 * générée par affectation.gs.
 *
 * Ensuite on cherche des améliorations :
 *
 * - échange de joueurs entre groupes
 * - déplacement d'un joueur
 * - amélioration score global
 *
 * Algorithme :
 *
 * Recherche locale avec conservation
 * uniquement des améliorations.
 *
 * ===========================================================
 */

/**
 * Point d'entrée optimisation
 */
function optimiserRepartition(creneaux, parametres) {
  const iterations = parametres.iterations || 500;

  let scoreActuel = scoreAffectationTotale(creneaux);

  Logger.log("Score initial : " + scoreActuel);

  for (let i = 0; i < iterations; i++) {
    const amelioration = tenterAmelioration(creneaux);

    if (amelioration) {
      scoreActuel = scoreAffectationTotale(creneaux);
    }
  }

  Logger.log("Score final : " + scoreActuel);

  return creneaux;
}

/**
 * ===========================================================
 * UNE ITERATION
 * ===========================================================
 */
function tenterAmelioration(creneaux) {
  /*
    Choisir deux créneaux
  */

  const couples = genererCouplesCreneaux(creneaux);

  for (let couple of couples) {
    const resultat = testerEchange(couple[0], couple[1]);

    if (resultat) return true;
  }

  return false;
}

/**
 * ===========================================================
 * GENERATION DES COUPLES
 * ===========================================================
 */
function genererCouplesCreneaux(creneaux) {
  const couples = [];

  for (let i = 0; i < creneaux.length; i++) {
    for (let j = i + 1; j < creneaux.length; j++) {
      if (creneaux[i].joueurs.length === 0) continue;

      if (creneaux[j].joueurs.length === 0) continue;

      couples.push([creneaux[i], creneaux[j]]);
    }
  }

  return melanger(couples);
}

/**
 * ===========================================================
 * TEST ECHANGE ENTRE DEUX GROUPES
 * ===========================================================
 */
function testerEchange(groupeA, groupeB) {
  const avant =
    calculerScoreGroupe(groupeA.joueurs) + calculerScoreGroupe(groupeB.joueurs);

  for (let i = 0; i < groupeA.joueurs.length; i++) {
    for (let j = 0; j < groupeB.joueurs.length; j++) {
      const joueurA = groupeA.joueurs[i];

      const joueurB = groupeB.joueurs[j];

      /*
        Vérification compatibilité
      */

      if (!echangePossible(joueurA, groupeB)) continue;

      if (!echangePossible(joueurB, groupeA)) continue;

      /*
        Simulation
      */

      groupeA.joueurs[i] = joueurB;

      groupeB.joueurs[j] = joueurA;

      const apres =
        calculerScoreGroupe(groupeA.joueurs) +
        calculerScoreGroupe(groupeB.joueurs);

      /*
        On garde seulement
        les améliorations
      */

      if (apres > avant) {
        joueurA.affectation = groupeB.nom;

        joueurB.affectation = groupeA.nom;

        return true;
      }

      /*
        Annulation
      */

      groupeA.joueurs[i] = joueurA;

      groupeB.joueurs[j] = joueurB;
    }
  }

  return false;
}

/**
 * ===========================================================
 * VALIDATION ECHANGE
 * ===========================================================
 */
function echangePossible(joueur, groupe) {
  /*
    Vérifie la catégorie
  */

  if (groupe.categorie && joueur.categorie !== groupe.categorie) {
    if (estJeune(joueur)) return false;
  }

  /*
    Contrôle âge jeunes
  */

  if (estJeune(joueur) && groupe.joueurs.length > 0) {
    const ageMoy = moyenne(groupe.joueurs, (j) => j.age);

    if (Math.abs(joueur.age - ageMoy) > limiteAge(joueur.categorie))
      return false;
  }

  return true;
}

/**
 * ===========================================================
 * LIMITES D'AGE
 * ===========================================================
 */
function limiteAge(categorie) {
  switch (categorie) {
    case "BABY":
      return 1;

    case "Primaire":
      return 2;

    case "College":
      return 3;

    default:
      return 99;
  }
}

/**
 * ===========================================================
 * DEPLACEMENT SIMPLE
 * ===========================================================
 */
function tenterDeplacement(creneaux) {
  for (let source of creneaux) {
    for (let joueur of source.joueurs) {
      for (let destination of creneaux) {
        if (source === destination) continue;

        if (!placeDisponible(destination)) continue;

        if (!echangePossible(joueur, destination)) continue;

        const avant = scoreAffectationTotale(creneaux);

        source.joueurs = source.joueurs.filter((j) => j !== joueur);

        destination.joueurs.push(joueur);

        const apres = scoreAffectationTotale(creneaux);

        if (apres > avant) {
          joueur.affectation = destination.nom;

          return true;
        }

        /*
          rollback
        */

        destination.joueurs = destination.joueurs.filter((j) => j !== joueur);

        source.joueurs.push(joueur);
      }
    }
  }

  return false;
}

/**
 * ===========================================================
 * OPTIMISATION COMPLETE
 * ===========================================================
 */

function optimisationComplete(creneaux) {
  journalInfo("OPTIMISATION", "Début optimisation");

  const joueurs = creneaux.flatMap((c) => c.joueurs || []);

  const joueursLibres = joueursRecalculables(joueurs);

  journalInfo("OPTIMISATION", "Joueurs totaux", joueurs.length);

  journalInfo("OPTIMISATION", "Joueurs recalculables", joueursLibres.length);
  let progression = true;

  let tours = 0;

  while (progression && tours < 100) {
    progression = false;

    if (tenterAmelioration(creneaux)) {
      progression = true;
    }

    if (tenterDeplacement(creneaux)) {
      progression = true;
    }

    tours++;
  }

  return creneaux;
}
