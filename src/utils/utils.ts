/**
 * ===========================================================
 * utils.gs
 * Fonctions utilitaires communes
 * ===========================================================
 */

/**
 * Construit un index colonne à partir des entêtes
 *
 * Exemple :
 * ["Nom","Prénom","Age"]
 *
 * devient :
 * {
 *   Nom:0,
 *   Prénom:1,
 *   Age:2
 * }
 */
function construireIndex(headers) {
  const index = {};

  headers.forEach((h, i) => {
    if (h !== undefined && h !== null) {
      index[String(h).trim()] = i;
    }
  });

  return index;
}

/**
 * Vérifie si une ligne est vide
 */
function ligneVide(ligne) {
  return ligne.every(
    (cellule) => cellule === "" || cellule === null || cellule === undefined,
  );
}

/**
 * Lecture texte sécurisée
 */
function lireTexte(valeur) {
  if (valeur === null || valeur === undefined) return "";

  return String(valeur).trim();
}

/**
 * Lecture nombre sécurisée
 */
function lireNombre(valeur) {
  if (valeur === null || valeur === undefined || valeur === "") return 0;

  if (typeof valeur === "number") return valeur;

  const nombre = Number(String(valeur).replace(",", ".").trim());

  return isNaN(nombre) ? 0 : nombre;
}

/**
 * Lecture booléen
 *
 * Gère :
 * TRUE
 * Oui
 * OUI
 * 1
 * X
 */
function lireBoolean(valeur) {
  if (valeur === true) return true;

  if (
    valeur === false ||
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  )
    return false;

  const texte = String(valeur).toLowerCase().trim();

  return ["true", "oui", "yes", "1", "x"].includes(texte);
}

/**
 * Nettoyage classement FFT
 *
 * Exemples :
 *
 * "30/2 "
 * devient
 * "30/2"
 *
 */
function nettoyerClassement(valeur) {
  return lireTexte(valeur).replace(/\s+/g, "");
}

/**
 * Calcule l'âge réel depuis une date
 */
function calculerAge(dateNaissance) {
  if (!dateNaissance) return 0;

  const naissance = new Date(dateNaissance);

  if (Number.isNaN(naissance.getTime())) return 0;

  const aujourdHui = new Date();

  let age = aujourdHui.getFullYear() - naissance.getFullYear();

  const mois = aujourdHui.getMonth() - naissance.getMonth();

  if (mois < 0 || (mois === 0 && aujourdHui.getDate() < naissance.getDate())) {
    age--;
  }

  return age;
}

/**
 * Arrondi
 */
function arrondir(nombre, decimales) {
  const facteur = Math.pow(10, decimales);

  return Math.round(nombre * facteur) / facteur;
}

/**
 * Copie profonde d'un objet
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Mélange un tableau
 *
 * Utilisé par l'optimiseur
 */
function melanger(tableau) {
  const copie = [...tableau];

  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copie[i], copie[j]] = [copie[j], copie[i]];
  }

  return copie;
}

/**
 * Retourne un élément aléatoire
 */
function choisirAleatoire(tableau) {
  if (!tableau || tableau.length === 0) return null;

  return tableau[Math.floor(Math.random() * tableau.length)];
}

/**
 * Recherche un objet dans un tableau
 */
function trouver(tableau, fonction) {
  return tableau.find(fonction);
}

/**
 * Groupe un tableau par une propriété
 *
 * Exemple :
 *
 * grouperPar(joueurs,"categorie")
 */
function grouperPar(tableau, propriete) {
  return tableau.reduce((resultat, item) => {
    const cle = item[propriete];

    if (!resultat[cle]) resultat[cle] = [];

    resultat[cle].push(item);

    return resultat;
  }, {});
}

/**
 * Somme d'une propriété
 */
function sommePar(tableau, fonction) {
  return tableau.reduce((total, item) => total + fonction(item), 0);
}

/**
 * Moyenne
 */
function moyenne(tableau, fonction) {
  if (!tableau || tableau.length === 0) return 0;

  return sommePar(tableau, fonction) / tableau.length;
}

/**
 * Ecart type
 *
 * Utilisé pour mesurer
 * l'homogénéité des groupes
 */
function ecartType(tableau, fonction) {
  if (!tableau || tableau.length === 0) return 0;

  const moy = moyenne(tableau, fonction);

  const variance = moyenne(tableau, (item) =>
    Math.pow(fonction(item) - moy, 2),
  );

  return Math.sqrt(variance);
}

/**
 * Compare deux nombres
 */
function limiter(valeur, min, max) {
  return Math.max(min, Math.min(max, valeur));
}

/**
 * Création d'une feuille
 * si elle n'existe pas
 */
function obtenirOuCreerFeuille(nom) {
  const ss = SpreadsheetApp.getActive();

  let feuille = ss.getSheetByName(nom);

  if (!feuille) {
    feuille = ss.insertSheet(nom);
  }

  return feuille;
}

/**
 * Nettoyage feuille
 */
function viderFeuille(nom) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(nom);

  if (feuille) {
    feuille.clear();
  }
}

/**
 * Ecriture tableau complet
 */
function ecrireTableau(feuille, donnees) {
  if (!donnees || donnees.length === 0) {
    return;
  }

  const colonnes = Math.max(...donnees.map((ligne) => ligne.length));

  const normalise = donnees.map((ligne) => {
    const copie = ligne.slice();

    while (copie.length < colonnes) {
      copie.push("");
    }

    return copie;
  });

  feuille.getRange(1, 1, normalise.length, colonnes).setValues(normalise);
}

/**
 * Logger enrichi
 */
function log(message, obj) {
  if (obj) {
    Logger.log(message + " : " + JSON.stringify(obj));
  } else {
    Logger.log(message);
  }
}

/**
 * Pause contrôlée
 *
 * Utile pour éviter
 * les quotas Apps Script
 */
function pause(ms) {
  Utilities.sleep(ms);
}

/**
 * Date formatée
 */
function dateMaintenant() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm:ss",
  );
}

/**
 * Retourne un pourcentage arrondi
 */
function pourcentage(valeur, total) {
  if (!total || total === 0) {
    return 0;
  }

  return Math.round((valeur / total) * 100 * 10) / 10;
}
