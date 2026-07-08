/**
 * ===========================================================
 * journal.gs
 *
 * Gestion du journal d'exécution
 *
 * Stocke les étapes importantes dans l'onglet Journal
 *
 * ===========================================================
 */

const JOURNAL_FEUILLE = "Journal";

/**
 * ===========================================================
 * INITIALISATION
 * ===========================================================
 */
function initialiserJournal() {
  const feuille = obtenirOuCreerFeuille(JOURNAL_FEUILLE);

  feuille.clear();

  feuille.appendRow(["Date", "Niveau", "Etape", "Message", "Valeur"]);

  feuille.setFrozenRows(1);

  feuille.autoResizeColumns(1, 5);
}

/**
 * ===========================================================
 * ECRITURE JOURNAL
 * ===========================================================
 */
function journaliser(etape, message, valeur, niveau) {
  const feuille = obtenirOuCreerFeuille(JOURNAL_FEUILLE);

  if (!niveau) {
    niveau = "INFO";
  }

  feuille.appendRow([new Date(), niveau, etape, message, valeur || ""]);

  /*
    Aussi dans les logs Apps Script
  */

  Logger.log(niveau + " | " + etape + " | " + message + " | " + (valeur || ""));
}

/**
 * ===========================================================
 * RACCOURCIS
 * ===========================================================
 */

function journalInfo(etape: string, message: string, valeur?: unknown) {
  journaliser(etape, message, valeur, "INFO");
}

function journalErreur(etape: string, message: string, valeur?: unknown) {
  journaliser(etape, message, valeur, "ERREUR");
}

function journalDebug(etape: string, message: string, valeur?: unknown) {
  journaliser(etape, message, valeur, "DEBUG");
}

/**
 * ===========================================================
 * MESURE TEMPS
 * ===========================================================
 */

function debutChrono(nom) {
  const props = PropertiesService.getScriptProperties();

  props.setProperty("CHRONO_" + nom, String(new Date().getTime()));
}

function finChrono(nom) {
  const props = PropertiesService.getScriptProperties();

  const debut = Number(props.getProperty("CHRONO_" + nom));

  if (!debut) return 0;

  const duree = (new Date().getTime() - debut) / 1000;

  journalInfo("CHRONO", nom, duree + " secondes");

  return duree;
}

/**
 * ===========================================================
 * RESUME EXECUTION
 * ===========================================================
 */
function journalResume(joueurs, creneaux) {
  journalInfo("RESUME", "Nombre joueurs", joueurs.length);

  journalInfo("RESUME", "Nombre créneaux", creneaux.length);

  const affectes = joueurs.filter((j) => j.affectation).length;

  journalInfo("RESUME", "Joueurs affectés", affectes);
}

/**
 * ===========================================================
 * NETTOYAGE
 * ===========================================================
 */
function viderJournal() {
  const feuille = obtenirOuCreerFeuille(JOURNAL_FEUILLE);

  feuille.clear();
}
