/**
 * ===========================================================
 * main.gs
 *
 * Orchestrateur principal
 *
 * Ce fichier pilote tout le processus :
 *
 * 1 - Lecture des feuilles
 * 2 - Nettoyage des joueurs
 * 3 - Calcul des niveaux
 * 4 - Première affectation
 * 5 - Optimisation
 * 6 - Export
 * 7 - Statistiques
 *
 * ===========================================================
 */

/**
 * ===========================================================
 * EXECUTION COMPLETE
 * ===========================================================
 */
function lancerRepartition() {
  initialiserJournal();
  debutChrono("REPARTITION");
  journalInfo("START", "Début calcul répartition");
  const debut = new Date();
  SpreadsheetApp.getActive().toast("Calcul de la répartition en cours...");

  const contexte = chargerContexte();

  journalInfo("LECTURE", "Joueurs chargés", contexte.joueurs.length);

  journalInfo("LECTURE", "Créneaux chargés", contexte.creneaux.length);

  const joueurs = enrichirJoueurs(contexte.joueurs);

  journalInfo("PREPARATION", "Joueurs enrichis", joueurs.length);
  const erreurs = controlerJoueurs(joueurs);

  if (erreurs.length > 0) {
    afficherErreurs(erreurs);

    return;
  }

  const creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);

  optimiserRepartition(creneaux, {
    iterations: 500,
  });

  journalInfo("AFFECTATION", "Groupes créés", creneaux.length);

  exporterGroupes(creneaux);

  journalInfo("EXPORT", "Export groupes terminé");

  journalResume(joueurs, contexte.creneaux);

  const stats = genererStatistiques(joueurs, creneaux);

  exporterStatistiques(stats);

  const duree = (new Date() - debut) / 1000;

  SpreadsheetApp.getActive().toast("Terminé en " + duree + " secondes");

  finChrono("REPARTITION");
}

/**
 * ===========================================================
 * OPTIMISATION SEULE
 * ===========================================================
 */
function lancerOptimisation() {
  const ss = SpreadsheetApp.getActive();

  ss.toast("Optimisation...");

  /*
    On recharge depuis
    la feuille mémoire
    */

  const contexte = chargerContexte();

  /*
    Pour le moment :
    recalcul complet
    */

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);

  optimisationComplete(creneaux);

  exporterGroupes(creneaux);

  ss.toast("Optimisation terminée");
}

/**
 * ===========================================================
 * EXPORT SEUL
 * ===========================================================
 */
function lancerExport() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);

  exporterGroupes(creneaux);
}

/**
 * ===========================================================
 * STATISTIQUES SEULES
 * ===========================================================
 */
function lancerStatistiques() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);

  const stats = genererStatistiques(joueurs, creneaux);

  exporterStatistiques(stats);
}

/**
 * ===========================================================
 * DIAGNOSTIC
 * ===========================================================
 */
function diagnosticDonnees() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const stats = statistiquesLecture(joueurs);

  Logger.log(JSON.stringify(stats, null, 2));

  SpreadsheetApp.getActive().toast("Diagnostic envoyé dans les logs");
}

/**
 * ===========================================================
 * ERREURS
 * ===========================================================
 */
function afficherErreurs(erreurs) {
  const ui = SpreadsheetApp.getUi();

  ui.alert("Erreurs détectées", erreurs.join("\n"), ui.ButtonSet.OK);
}

/**
 * ===========================================================
 * TEST RAPIDE DU MOTEUR
 * ===========================================================
 */
function testMoteur() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  Logger.log("Joueurs : " + joueurs.length);

  const creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);

  Logger.log("Créneaux : " + creneaux.length);

  Logger.log(JSON.stringify(analyserAffectation(creneaux), null, 2));
}
