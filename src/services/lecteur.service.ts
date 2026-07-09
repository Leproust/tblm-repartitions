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

  const indexNormalise = construireIndexEnTetesNormalise(headers);

  const colonnesVoeuxTrouvees = VOEUX.filter(
    (v) => index[v] !== undefined || indexNormalise[normaliserEnTete(v)] !== undefined,
  );

  if (colonnesVoeuxTrouvees.length === 0) {
    Logger.log(
      "ATTENTION : aucune colonne de voeu (\"Voeu 1\" à \"Voeu 5\") trouvée dans les en-têtes de Licencies. " +
        "En-têtes lus : " + headers.join(" | "),
    );
  }

  const joueurs = [];

  data.forEach((ligne, numero) => {
    if (ligneVide(ligne)) return;

    try {
      const joueur = parserJoueur(ligne, index, indexNormalise);

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

/**
 * Normalise un en-tête pour un matching tolérant :
 * casse, ligature œ/Œ, espaces superflus.
 * Utilisé uniquement en secours quand la correspondance
 * exacte ("Voeu 1", etc.) échoue, pour éviter qu'une variante
 * d'en-tête ("Vœu 1", "VOEU 1"...) fasse perdre les vœux de
 * tous les joueurs sans qu'aucune erreur ne remonte.
 */
function normaliserEnTete(texte) {
  if (texte === null || texte === undefined) return "";

  return String(texte)
    .trim()
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/\s+/g, " ");
}

function construireIndexEnTetesNormalise(headers) {
  const index = {};

  headers.forEach((h, i) => {
    if (h !== undefined && h !== null) {
      index[normaliserEnTete(h)] = i;
    }
  });

  return index;
}

/* ===========================================================
 * PARSER JOUEUR
 * ===========================================================
 */

function parserJoueur(ligne, index, indexNormalise) {
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

    voeux: lireVoeux(ligne, index, indexNormalise),

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

function lireVoeux(ligne, index, indexNormalise) {
  const liste = [];

  VOEUX.forEach((v) => {
    let position = index[v];

    if (position === undefined && indexNormalise) {
      position = indexNormalise[normaliserEnTete(v)];
    }

    if (position === undefined) {
      return;
    }

    const valeur = lireTexte(ligne[position]);

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

    const effectif = lireNombre(l[index["Effectif"]]);

    liste.push({
      nom: lireTexte(l[index["Creneau"]]),

      jour: lireTexte(l[index["Jour"]]),

      heure: lireTexte(l[index["Heure"]]),

      categorie: lireTexte(l[index["Catégorie"]]),

      effectif,

      capacite: effectif,

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

  if (valeur.includes("baby")) return CATEGORIES.BABY;

  if (valeur.includes("primaire")) return CATEGORIES.PRIMAIRE;

  if (valeur.includes("college") || valeur.includes("collège"))
    return CATEGORIES.COLLEGE;

  if (valeur.includes("femme")) return CATEGORIES.FEMME;

  if (valeur.includes("homme")) return CATEGORIES.HOMME_ADULTE;

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

    baby: joueurs.filter((j) => j.categorie === CATEGORIES.BABY).length,

    primaire: joueurs.filter((j) => j.categorie === CATEGORIES.PRIMAIRE).length,

    college: joueurs.filter((j) => j.categorie === CATEGORIES.COLLEGE).length,

    adultes: joueurs.filter((j) =>
      [CATEGORIES.FEMME, CATEGORIES.HOMME_ADULTE].includes(j.categorie),
    ).length,
  };
}
