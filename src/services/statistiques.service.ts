/**
 * ===========================================================
 * statistiques.gs
 *
 * Analyse qualité de la répartition
 *
 * Produit :
 *
 * - taux de satisfaction des voeux
 * - équilibre des groupes
 * - dispersion âge
 * - dispersion niveau
 * - groupes faibles
 * - joueurs non affectés
 *
 * ===========================================================
 */

/**
 * ===========================================================
 * POINT D'ENTREE
 * ===========================================================
 */
function genererStatistiques(joueurs, creneaux) {
  return {
    global: statistiquesGlobales(joueurs),

    groupes: statistiquesGroupes(creneaux),

    voeux: statistiquesVoeux(joueurs),

    problemes: detecterProblemes(joueurs, creneaux),
  };
}

/**
 * ===========================================================
 * STATISTIQUES GENERALES
 * ===========================================================
 */
function statistiquesGlobales(joueurs) {
  const total = joueurs.length;

  const affectes = joueurs.filter((j) => j.affectation).length;

  return {
    joueurs: total,

    affectes: affectes,

    nonAffectes: total - affectes,

    tauxAffectation: total === 0 ? 0 : arrondir((affectes / total) * 100, 1),
  };
}

/**
 * ===========================================================
 * STATISTIQUES DES GROUPES
 * ===========================================================
 */
function statistiquesGroupes(creneaux) {
  return creneaux.map((c) => {
    return {
      creneau: c.nom,

      categorie: c.categorie,

      effectif: c.joueurs.length,

      capacite: c.capacite,

      tauxRemplissage:
        c.capacite === 0
          ? 0
          : arrondir((c.joueurs.length / c.capacite) * 100, 1),

      ageMoyen: arrondir(
        moyenne(c.joueurs, (j) => j.age),
        1,
      ),

      dispersionAge: arrondir(
        ecartType(c.joueurs, (j) => j.age),
        2,
      ),

      niveauMoyen: arrondir(niveauMoyen(c.joueurs), 2),

      dispersionNiveau: arrondir(dispersionNiveau(c.joueurs), 2),
    };
  });
}

/**
 * ===========================================================
 * SATISFACTION DES VOEUX
 * ===========================================================
 */
function statistiquesVoeux(joueurs) {
  let premier = 0;

  let deuxieme = 0;

  let troisieme = 0;

  let autre = 0;

  let aucun = 0;

  joueurs.forEach((joueur) => {
    if (!joueur.affectation) {
      aucun++;

      return;
    }

    const nomAffectation = cleComparaisonCreneau(joueur.affectation);

    const position = (joueur.voeux || []).findIndex(
      (v) => cleComparaisonCreneau(v) === nomAffectation,
    );

    switch (position) {
      case 0:
        premier++;
        break;

      case 1:
        deuxieme++;
        break;

      case 2:
        troisieme++;
        break;

      default:
        autre++;
    }
  });

  const total = joueurs.length;

  return {
    premierChoix: pourcentage(premier, total),

    deuxiemeChoix: pourcentage(deuxieme, total),

    troisiemeChoix: pourcentage(troisieme, total),

    autre: pourcentage(autre, total),

    aucun: pourcentage(aucun, total),
  };
}

/**
 * ===========================================================
 * DETECTION PROBLEMES
 * ===========================================================
 */
function detecterProblemes(joueurs, creneaux) {
  const problemes = [];

  /*
    Joueurs sans groupe
  */

  joueurs
    .filter((j) => !j.affectation)
    .forEach((j) => {
      problemes.push({
        type: "NON_AFFECTE",

        joueur: j.nom + " " + j.prenom,
      });
    });

  /*
    Groupes trop grands
  */

  creneaux.forEach((c) => {
    if (c.joueurs.length > c.capacite) {
      problemes.push({
        type: "SURBOOKING",

        creneau: c.nom,

        valeur: c.joueurs.length - c.capacite,
      });
    }

    /*
        Groupe jeune avec
        trop d'écart âge
      */

    if (c.joueurs.length > 1 && estJeune(c.joueurs[0])) {
      const dispersion = ecartType(c.joueurs, (j) => j.age);

      if (dispersion > 2) {
        problemes.push({
          type: "AGE",

          creneau: c.nom,

          dispersion: arrondir(dispersion, 2),
        });
      }
    }
  });

  return problemes;
}

/**
 * ===========================================================
 * SCORE QUALITE GLOBAL
 * ===========================================================
 */
function scoreQualiteGlobale(joueurs, creneaux) {
  let score = 100;

  const voeux = statistiquesVoeux(joueurs);

  /*
    Pénalité voeux
  */

  score -= voeux.aucun * 0.5;

  /*
    Pénalité dispersion groupes
  */

  creneaux.forEach((c) => {
    score -= dispersionNiveau(c.joueurs) * 2;

    if (c.joueurs.length > 0 && estJeune(c.joueurs[0])) {
      score -= ecartType(c.joueurs, (j) => j.age) * 5;
    }
  });

  return arrondir(Math.max(0, score), 2);
}

/**
 * ===========================================================
 * EXPORT DES STATISTIQUES
 * ===========================================================
 */
function exporterStatistiques(stats) {
  const feuille = obtenirOuCreerFeuille("Statistiques");

  feuille.clear();

  const lignes = [];

  lignes.push(["Indicateur", "Valeur"]);

  Object.keys(stats.global).forEach((cle) => {
    lignes.push([cle, stats.global[cle]]);
  });

  lignes.push(["", ""]);

  lignes.push(["Satisfaction voeux"]);

  Object.keys(stats.voeux).forEach((cle) => {
    lignes.push([cle, stats.voeux[cle]]);
  });

  ecrireTableau(feuille, lignes);

  feuille.autoResizeColumns(1, 2);
}
