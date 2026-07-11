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
 *
 * `parametres.config` est la config chargée depuis la feuille Config.
 * Elle est transmise aux calculs de score pour que les poids
 * personnalisés par le club soient respectés pendant l'optimisation,
 * pas seulement pendant l'affectation initiale.
 */
function optimiserRepartition(creneaux: CreneauData[], parametres) {
  parametres = parametres || {};

  const iterations = parametres.iterations || OPTIMISATION.iterations;
  const config = parametres.config;

  let scoreActuel = scoreAffectationTotaleV2(creneaux, config);

  Logger.log("Score initial : " + scoreActuel);

  for (let i = 0; i < iterations; i++) {
    const amelioration = tenterAmelioration(creneaux, config);

    if (amelioration) {
      scoreActuel = scoreAffectationTotaleV2(creneaux, config);
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
function tenterAmelioration(creneaux: CreneauData[], config) {
  /*
    Choisir deux créneaux
  */

  const couples = genererCouplesCreneaux(creneaux);

  for (let couple of couples) {
    const resultat = testerEchange(couple[0], couple[1], config);

    if (resultat) return true;
  }

  return false;
}

/**
 * ===========================================================
 * GENERATION DES COUPLES
 * ===========================================================
 */
function genererCouplesCreneaux(creneaux: CreneauData[]) {
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
function testerEchange(groupeA: CreneauData, groupeB: CreneauData, config) {
  const joueursA = groupeA.joueurs.filter((j) => !estVerrouille(j));

  const joueursB = groupeB.joueurs.filter((j) => !estVerrouille(j));
  const avant =
    scoreCreneauCompletV2(groupeA, config) + scoreCreneauCompletV2(groupeB, config);

  for (let i = 0; i < joueursA.length; i++) {
    const joueurA = joueursA[i];
    for (let j = 0; j < joueursB.length; j++) {
      const joueurB = joueursB[j];

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
        scoreCreneauCompletV2(groupeA, config) +
        scoreCreneauCompletV2(groupeB, config);

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
function echangePossible(joueur: JoueurData, groupe: CreneauData) {
  /*
    Vérifie le respect des voeux (mêmes règles
    que l'affectation initiale : un joueur avec des voeux
    ne doit jamais être déplacé hors de ses voeux)
  */

  if (!voeuCompatible(joueur, groupe)) return false;

  /*
    Vérifie la catégorie (même règle que l'affectation
    initiale : les adultes ne se mélangent jamais entre
    Homme adulte et Femme. Avant ce correctif, cette
    contrainte n'était appliquée qu'aux jeunes ici, ce qui
    permettait à un adulte d'être déplacé vers un créneau
    de la mauvaise catégorie pendant l'optimisation)
  */

  if (!categorieCompatible(joueur, groupe)) return false;

  /*
    Vérifie la compétition : l'optimisation (échanges,
    déplacements) ne doit jamais CREER un nouveau mélange
    compétition/non-compétition. Un joueur déjà placé en
    repli (mélangé) pourra quand même être amélioré vers un
    créneau compatible s'il en apparaît un pendant
    l'optimisation, puisque cette vérification porte sur la
    DESTINATION, pas sur l'état actuel du joueur.
  */

  if (!competitionCompatible(joueur, groupe)) return false;

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
    case CATEGORIES.BABY:
      return 1;

    case CATEGORIES.PRIMAIRE:
      return 2;

    case CATEGORIES.COLLEGE:
      return 3;

    default:
      return 99;
  }
}

/**
 * ===========================================================
 * DEPLACEMENT SIMPLE
 * ===========================================================
 *
 * On ne recalcule le score que pour les deux créneaux concernés
 * (source et destination), pas pour la répartition entière :
 * ce sont les deux seuls groupes dont la composition change,
 * donc les seuls dont le score peut varier.
 */
function tenterDeplacement(creneaux: CreneauData[], config) {
  for (let source of creneaux) {
    for (let joueur of source.joueurs.filter((j) => !estVerrouille(j))) {
      for (let destination of creneaux) {
        if (source === destination) continue;

        if (!placesDisponibles(destination)) continue;

        if (!echangePossible(joueur, destination)) continue;

        const avant =
          scoreCreneauCompletV2(source, config) +
          scoreCreneauCompletV2(destination, config);

        source.joueurs = source.joueurs.filter((j) => j !== joueur);

        destination.joueurs.push(joueur);

        const apres =
          scoreCreneauCompletV2(source, config) +
          scoreCreneauCompletV2(destination, config);

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
function optimisationComplete(creneaux: CreneauData[], config) {
  journalInfo("OPTIMISATION", "Début optimisation");

  const scoreDebut = scoreAffectationTotaleV2(creneaux, config);

  journalInfo("SCORE", "Score début optimisation", scoreDebut);

  const joueurs = creneaux.flatMap((c) => c.joueurs || []);

  const joueursLibres = joueursRecalculables(joueurs);

  journalInfo("OPTIMISATION", "Joueurs totaux", joueurs.length);

  journalInfo("OPTIMISATION", "Joueurs recalculables", joueursLibres.length);

  let progression = true;

  let tours = 0;

  while (progression && tours < 100) {
    progression = false;

    if (tenterAmelioration(creneaux, config)) {
      progression = true;
    }

    if (tenterDeplacement(creneaux, config)) {
      progression = true;
    }

    tours++;
  }

  const scoreFin = scoreAffectationTotaleV2(creneaux, config);

  journalInfo("SCORE", "Score fin optimisation", scoreFin);

  journalInfo("OPTIMISATION", "Tours effectués", tours);

  journalInfo("OPTIMISATION", "Gain", scoreFin - scoreDebut);

  return creneaux;
}
