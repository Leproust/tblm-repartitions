/**
 * ===========================================================
 * lecteur.gs
 * Lecture des feuilles Google Sheets
 * ===========================================================
 */

function chargerContexte() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const joueurs = lireJoueurs(ss) || [];

  const creneaux = lireCreneaux(ss) || [];

  const config = lireConfiguration(ss) || {};

  Logger.log("CONTEXTE");

  Logger.log("Joueurs : " + joueurs.length);

  Logger.log("Créneaux : " + creneaux.length);

  Logger.log("Config : " + Object.keys(config).length);

  return {
    joueurs,
    creneaux,
    config,
  };
}

/* ===========================================================
 * LICENCIES
 * ===========================================================
 */

function lireJoueurs(ss) {
  const feuille = ss.getSheetByName(SHEETS.LICENCIES);

  if (!feuille) throw new Error("Feuille Licencies introuvable");

  const data = feuille.getDataRange().getValues();

  if (data.length < 2) return [];

  const headers = data.shift();

  const index = construireIndex(headers);

  const joueurs = [];

  data.forEach((ligne, numero) => {
    if (ligneVide(ligne)) return;

    try {
      const joueur = parserJoueur(ligne, index);

      if (joueur) {
        joueurs.push(normaliserJoueur(joueur));
      }
    } catch (e) {
      Logger.log("Erreur ligne " + (numero + 2) + " : " + e.message);
    }
  });

  Logger.log(joueurs.length + " joueur(s) chargé(s)");

  return joueurs;
}

/* ===========================================================
 * PARSER JOUEUR
 * ===========================================================
 */

function parserJoueur(ligne, index) {
  const joueur = {
    nouveau: lireBoolean(ligne[index["Nouveau Adherent"]]),

    licence: lireTexte(ligne[index["Licence"]]),

    nom: lireTexte(ligne[index["Nom"]]),

    prenom: lireTexte(ligne[index["Prénom"]]),

    categorie: lireTexte(ligne[index["Categorie"]]),

    naissance: ligne[index["Date Naissance"]],

    age: lireNombre(ligne[index["Âge"]]),

    sexe: lireTexte(ligne[index["Sexe"]]),

    classement: nettoyerClassement(lireTexte(ligne[index["Classement"]])),

    niveau: 0,

    anciennete: lireNombre(ligne[index["Annee Tennis"]]),

    meilleurClassement: lireTexte(ligne[index["Meilleur Classement"]]),

    competition: lireBoolean(ligne[index["Competition"]]),

    voeux: lireVoeux(ligne, index),

    affectation: null,

    score: 0,
  };

  if (!verifierJoueur(joueur)) {
    return null;
  }

  return joueur;
}

/* ===========================================================
 * VOEUX
 * ===========================================================
 */

function lireVoeux(ligne, index) {
  const liste = [];

  VOEUX.forEach((v) => {
    const valeur = lireTexte(ligne[index[v]]);

    if (valeur != "") liste.push(valeur);
  });

  return liste;
}

/* ===========================================================
 * VALIDATION
 * ===========================================================
 */

function verifierJoueur(j) {
  if (!j.nom && !j.prenom) {
    Logger.log("Ligne ignorée : joueur sans identité");

    return false;
  }

  if (!j.categorie) {
    j.categorie = "A controler";
  }

  return true;
}

/* ===========================================================
 * CRENEAUX
 * ===========================================================
 */

function lireCreneaux(ss) {
  const feuille = ss.getSheetByName(SHEETS.CRENEAUX);

  if (!feuille) throw new Error("Feuille Creneaux introuvable");

  const data = feuille.getDataRange().getValues();

  const headers = data.shift();

  const index = construireIndex(headers);

  const liste = [];

  data.forEach((l) => {
    if (ligneVide(l)) return;

    liste.push({
      nom: lireTexte(l[index["Creneau"]]),

      jour: lireTexte(l[index["Jour"]]),

      heure: lireTexte(l[index["Heure"]]),

      categorie: lireTexte(l[index["Catégorie"]]),

      capacite: lireNombre(l[index["Effectif"]]),

      surbooking: lireNombre(l[index["Surbooking"]]),

      actif: lireTexte(l[index["Actif"]]) == "Oui",

      joueurs: [],
    });
  });

  Logger.log(liste.length + " créneaux chargés");

  return liste;
}

/* ===========================================================
 * CONFIG
 * ===========================================================
 */

function lireConfiguration(ss) {
  const feuille = ss.getSheetByName(SHEETS.CONFIG);

  if (!feuille) throw new Error("Feuille Config absente");

  const valeurs = feuille.getDataRange().getValues();

  const config = {};

  valeurs.slice(1).forEach((l) => {
    config[lireTexte(l[0])] = l[1];
  });

  return config;
}

/**
 * ===========================================================
 * NORMALISATION METIER DES JOUEURS
 * ===========================================================
 */

/**
 * Normalise un joueur après lecture
 */
function normaliserJoueur(joueur) {
  joueur.nom = normaliserTexte(joueur.nom);

  joueur.prenom = normaliserTexte(joueur.prenom);

  joueur.categorie = normaliserCategorie(joueur.categorie);

  joueur.sexe = normaliserSexe(joueur.sexe);

  joueur.classement = nettoyerClassement(joueur.classement);

  if (joueur.age === 0 && joueur.naissance) {
    joueur.age = calculerAge(joueur.naissance);
  }

  joueur.voeux = nettoyerVoeux(joueur.voeux);

  return joueur;
}

/**
 * ===========================================================
 * TEXTE
 * ===========================================================
 */
function normaliserTexte(texte) {
  if (!texte) return "";

  return String(texte).trim().replace(/\s+/g, " ");
}

/**
 * ===========================================================
 * CATEGORIES
 * ===========================================================
 */
function normaliserCategorie(categorie) {
  if (!categorie) return "";

  const valeur = categorie.toString().trim().toLowerCase();

  if (valeur.includes("baby")) return "BABY";

  if (valeur.includes("primaire")) return "Primaire";

  if (valeur.includes("college") || valeur.includes("collège"))
    return "College";

  if (valeur.includes("femme")) return "Femme";

  if (valeur.includes("homme")) return "Homme adulte";

  return categorie;
}

/**
 * ===========================================================
 * SEXE
 * ===========================================================
 */
function normaliserSexe(sexe) {
  if (!sexe) return "";

  const valeur = String(sexe).toUpperCase().trim();

  if (valeur === "F" || valeur === "FEMME") return "F";

  if (valeur === "H" || valeur === "HOMME") return "H";

  return valeur;
}

/**
 * ===========================================================
 * VOEUX
 * ===========================================================
 */
function nettoyerVoeux(voeux) {
  if (!voeux) return [];

  return voeux.filter((v) => v && v.trim() != "").map((v) => v.trim());
}

/**
 * ===========================================================
 * CONTROLES
 * ===========================================================
 */

/**
 * Vérifie les données joueurs
 */
function controlerJoueurs(joueurs) {
  const erreurs = [];

  joueurs.forEach((j, index) => {
    if (!j.nom) {
      erreurs.push("Joueur ligne " + index + " sans nom");
    }

    if (!j.categorie) {
      erreurs.push(j.nom + " : catégorie absente");
    }

    if (j.voeux.length === 0) {
      Logger.log(j.nom + " sans voeu");
    }
  });

  return erreurs;
}

/**
 * ===========================================================
 * ENRICHISSEMENT COMPLET
 * ===========================================================
 */
function enrichirJoueurs(joueurs) {
  joueurs.forEach((joueur) => {
    normaliserJoueur(joueur);
  });

  return joueurs;
}

/**
 * ===========================================================
 * STATISTIQUES DE LECTURE
 * ===========================================================
 */
function statistiquesLecture(joueurs) {
  return {
    total: joueurs.length,

    baby: joueurs.filter((j) => j.categorie === "BABY").length,

    primaire: joueurs.filter((j) => j.categorie === "Primaire").length,

    college: joueurs.filter((j) => j.categorie === "College").length,

    adultes: joueurs.filter((j) =>
      ["Femme", "Homme adulte"].includes(j.categorie),
    ).length,
  };
}
