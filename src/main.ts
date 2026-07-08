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

  const resultat = affecterJoueursV2(
    joueurs,
    contexte.creneaux,
    contexte.config,
  );

  const creneaux = resultat.creneaux;

  optimiserRepartition(creneaux, {
    iterations: 500,
    config: contexte.config,
  });

  journalInfo("AFFECTATION", "Groupes créés", creneaux.length);

  exporterGroupes(creneaux);

  journalInfo("EXPORT", "Export groupes terminé");

  journalResume(joueurs, contexte.creneaux);

  const stats = genererStatistiques(joueurs, creneaux);

  exporterStatistiques(stats);

  const duree = (new Date().getTime() - Date.now()) / 1000;

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

  const resultat = affecterJoueursV2(joueurs, contexte.creneaux, contexte.config);

  const creneaux = resultat.creneaux;

  optimisationComplete(creneaux, contexte.config);

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

  let creneaux = chargerGroupesDepuisFeuille(joueurs, contexte.creneaux);

  const totalJoueurs = creneaux.reduce((total, c) => total + (c.joueurs?.length || 0), 0);

  if (totalJoueurs === 0) {
    creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);
  }

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

  let creneaux = chargerGroupesDepuisFeuille(joueurs, contexte.creneaux);

  const totalJoueurs = creneaux.reduce((total, c) => total + (c.joueurs?.length || 0), 0);

  if (totalJoueurs === 0) {
    creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);
  }

  const stats = genererStatistiques(joueurs, creneaux);

  exporterStatistiques(stats);
}

/**
 * ===========================================================
 * DIAGNOSTIC
 * ===========================================================
 */
function validerRepartition() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const creneaux = chargerGroupesDepuisFeuille(joueurs, contexte.creneaux);

  if (!creneaux || creneaux.length === 0) {
    SpreadsheetApp.getActive().toast(
      "Aucun groupe trouvé dans l'onglet Groupes pour validation.",
    );
    return;
  }

  const stats = genererStatistiques(joueurs, creneaux);

  exporterStatistiques(stats);

  SpreadsheetApp.getActive().toast("Validation terminée. Statistiques mises à jour.");
}

function relancerRepartition() {
  initialiserJournal();
  debutChrono("REPARTITION_REPLAY");
  journalInfo("REPLAY", "Début replay de la répartition");
  SpreadsheetApp.getActive().toast("Rejeu de la répartition en cours...");

  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const creneaux = initialiserGroupesV2(contexte.creneaux);

  chargerGroupesDepuisFeuille(joueurs, creneaux, { onlyFixed: true });

  const resultat = affecterJoueursV2(joueurs, creneaux, contexte.config);

  const groupes = resultat.creneaux;

  optimiserRepartition(groupes, { iterations: 500, config: contexte.config });

  exporterGroupes(groupes);

  const stats = genererStatistiques(joueurs, groupes);

  exporterStatistiques(stats);

  exporterRapport(groupes, stats);

  SpreadsheetApp.getActive().toast("Rejeu terminé.");

  finChrono("REPARTITION_REPLAY");
}

function lancerRapports() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  let creneaux = chargerGroupesDepuisFeuille(joueurs, contexte.creneaux);

  const totalJoueurs = creneaux.reduce((total, c) => total + (c.joueurs?.length || 0), 0);

  if (totalJoueurs === 0) {
    creneaux = affecterJoueurs(joueurs, contexte.creneaux, contexte.config);
  }

  const stats = genererStatistiques(joueurs, creneaux);

  exporterRapport(creneaux, stats);

  SpreadsheetApp.getActive().toast("Rapport généré.");
}

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

function chargerGroupesDepuisFeuille(joueurs, creneaux, options: { onlyFixed?: boolean } = {}) {

  const feuille = SpreadsheetApp.getActive().getSheetByName(SHEETS.GROUPES);

  if (!feuille) {
    return creneaux;
  }

  const data = feuille.getDataRange().getValues();

  if (!data || data.length < 2) {
    return creneaux;
  }

  const index = construireIndex(data[0]);

  const joueursParLicence = {};
  const joueursParIdentite = {};

  joueurs.forEach((joueur) => {
    joueur.affectation = null;
    joueur.verrouille = false;

    if (joueur.licence) {
      joueursParLicence[joueur.licence.toString().trim().toLowerCase()] = joueur;
    }

    const cle = (
      joueur.nom + "|" + joueur.prenom + "|" + joueur.categorie
    )
      .toLowerCase()
      .trim();

    if (!joueursParIdentite[cle]) {
      joueursParIdentite[cle] = [];
    }

    joueursParIdentite[cle].push(joueur);
  });

  creneaux.forEach((c) => {
    c.joueurs = [];
  });

  data.slice(1).forEach((ligne) => {
    if (ligneVide(ligne)) return;

    const nomCreneau = lireTexte(ligne[index["Créneau"]]);

    if (!nomCreneau) return;

    const licence = lireTexte(ligne[index["Licence"]]);
    const nom = lireTexte(ligne[index["Nom"]]);
    const prenom = lireTexte(ligne[index["Prénom"]]);
    const categorie = lireTexte(ligne[index["Catégorie"]]);
    const fixe = lireTexte(ligne[index["Fixé"]]).toLowerCase();

    const estFixe = ["oui", "true", "1", "x"].includes(fixe);

    if (options.onlyFixed && !estFixe) return;

    if (!nom && !prenom && !licence) return;

    const joueur = trouverJoueurDansListe(
      joueursParLicence,
      joueursParIdentite,
      licence,
      nom,
      prenom,
      categorie,
    );

    if (!joueur) return;

    const creneau = creneaux.find((c) => c.nom === nomCreneau);

    if (!creneau) return;

    joueur.affectation = nomCreneau;
    joueur.verrouille = estFixe;
    creneau.joueurs.push(joueur);
  });

  return creneaux;
}

function trouverJoueurDansListe(
  joueursParLicence,
  joueursParIdentite,
  licence,
  nom,
  prenom,
  categorie,
) {
  if (licence) {
    const cleLicence = licence.toString().trim().toLowerCase();

    if (joueursParLicence[cleLicence]) {
      return joueursParLicence[cleLicence];
    }
  }

  if (!nom || !prenom) {
    return null;
  }

  const cleIdentite = (nom + "|" + prenom + "|" + categorie)
    .toLowerCase()
    .trim();

  const candidats = joueursParIdentite[cleIdentite];

  if (!candidats || candidats.length === 0) {
    return null;
  }

  return candidats.shift();
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
