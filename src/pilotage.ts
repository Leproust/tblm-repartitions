/**
 * ===========================================================
 * pilotage.gs
 *
 * Fonctions métier de pilotage de la répartition
 *
 * - Occupation des créneaux
 * - Joueurs sans affectation
 * - Validation / verrouillage
 *
 * ===========================================================
 */

/**
 * ===========================================================
 * OCCUPATION DES CRENEAUX
 *
 * Retourne les places disponibles
 * et les éventuels surbookings
 *
 * ===========================================================
 */
function analyserOccupationCreneaux(creneaux) {
  if (!creneaux) {
    return [];
  }

  return creneaux.map((c) => {
    const joueurs = c.joueurs || [];

    const effectif = joueurs.length;

    const capacite = Number(c.effectif) || 0;

    return {
      creneau: c.nom || c.creneau,

      jour: c.jour || "",

      heure: c.heure || "",

      categorie: c.categorie || "",

      capacite,

      inscrits: effectif,

      placesDisponibles: Math.max(0, capacite - effectif),

      surbooking: Math.max(0, effectif - capacite),
    };
  });
}

/**
 * ===========================================================
 * EXPORT OCCUPATION
 *
 * Création onglet Capacites
 *
 * ===========================================================
 */
function exporterOccupation() {
  const contexte = chargerContexte();

  const joueurs = enrichirJoueurs(contexte.joueurs);

  const creneaux = chargerGroupesDepuisFeuille(joueurs, contexte.creneaux);

  const occupation = analyserOccupationCreneaux(creneaux);

  const donnees = [
    [
      "Créneau",
      "Jour",
      "Heure",
      "Catégorie",
      "Capacité",
      "Inscrits",
      "Places disponibles",
      "Surbooking",
    ],
  ];

  occupation.forEach((c) => {
    donnees.push([
      c.creneau,

      c.jour,

      c.heure,

      c.categorie,

      c.capacite,

      c.inscrits,

      c.placesDisponibles,

      c.surbooking,
    ]);
  });

  const feuille = obtenirOuCreerFeuille("Capacites");

  feuille.clear();

  ecrireTableau(feuille, donnees);
}

/**
 * ===========================================================
 * JOUEURS AFFECTES (lecture de l'onglet Groupes)
 *
 * "Voir joueurs sans créneau" est un point d'entrée autonome,
 * indépendant d'un calcul de répartition qui viendrait de
 * tourner : il n'y a donc rien en mémoire pour savoir qui a
 * été affecté. La seule source fiable est ce qui a été
 * réellement écrit dans l'onglet "Groupes" par le dernier export.
 *
 * On identifie un joueur affecté par sa licence (fiable), avec
 * un repli sur Nom+Prénom si la licence n'a pas pu être lue.
 * ===========================================================
 */
function joueursAffectesDepuisGroupes() {
  const feuille = SpreadsheetApp.getActive().getSheetByName(SHEETS.GROUPES);

  const licences = new Set();
  const nomsPrenoms = new Set();

  if (!feuille) {
    return { licences, nomsPrenoms };
  }

  const data = feuille.getDataRange().getValues();

  if (data.length < 2) {
    return { licences, nomsPrenoms };
  }

  const headers = data.shift();

  const index = construireIndex(headers);

  data.forEach((ligne) => {
    const nom = lireTexte(ligne[index["Nom"]]);

    if (!nom || nom === "Aucun joueur") return;

    const licence = lireTexte(ligne[index["Licence"]]);

    if (licence) {
      licences.add(licence);
    }

    const prenom = lireTexte(ligne[index["Prénom"]]);

    nomsPrenoms.add(cleComparaisonTexte(nom) + "|" + cleComparaisonTexte(prenom));
  });

  return { licences, nomsPrenoms };
}

/**
 * ===========================================================
 * JOUEURS SANS CRENEAU
 *
 * ===========================================================
 */
function trouverJoueursSansCreneau(joueurs, affectes) {
  if (!joueurs) {
    return [];
  }

  return joueurs.filter((j) => {
    if (j.licence && affectes.licences.has(j.licence)) {
      return false;
    }

    const cle = cleComparaisonTexte(j.nom) + "|" + cleComparaisonTexte(j.prenom);

    return !affectes.nomsPrenoms.has(cle);
  });
}

/**
 * ===========================================================
 * EXPORT JOUEURS SANS CRENEAU
 *
 * ===========================================================
 */
function exporterJoueursSansCreneau() {
  const contexte = chargerContexte();

  const affectes = joueursAffectesDepuisGroupes();

  const joueurs = trouverJoueursSansCreneau(contexte.joueurs, affectes);

  const donnees = [
    ["Nom", "Prénom", "Catégorie", "Classement", "Voeu 1", "Voeu 2", "Voeu 3"],
  ];

  joueurs.forEach((j) => {
    donnees.push([
      j.nom,

      j.prenom,

      j.categorie,

      j.classement,

      j.voeux ? j.voeux[0] : "",

      j.voeux ? j.voeux[1] : "",

      j.voeux ? j.voeux[2] : "",
    ]);
  });

  const feuille = obtenirOuCreerFeuille("Sans créneau");

  feuille.clear();

  ecrireTableau(feuille, donnees);
}

/**
 * ===========================================================
 * VERROUILLAGE JOUEUR
 *
 * Permet de dire :
 * ce joueur ne doit plus bouger
 *
 * ===========================================================
 */
function verrouillerJoueur(joueur) {
  joueur.verrouille = true;
}

/**
 * ===========================================================
 * DEVERROUILLAGE JOUEUR
 *
 * ===========================================================
 */
function deverrouillerJoueur(joueur) {
  joueur.verrouille = false;
}

/**
 * ===========================================================
 * VERIFIER SI JOUEUR EST BLOQUE
 *
 * ===========================================================
 */
function estVerrouille(joueur) {
  return joueur && joueur.verrouille === true;
}

/**
 * ===========================================================
 * FILTRER JOUEURS LIBRES
 *
 * Utilisé par optimisation
 *
 * ===========================================================
 */
function joueursRecalculables(joueurs) {
  return joueurs.filter((j) => !estVerrouille(j));
}

/**
 * ===========================================================
 * STATUT D'UN GROUPE
 *
 * Pour évolution future :
 * validation manuelle depuis feuille Groupes
 *
 * ===========================================================
 */
function groupeEstValide(groupe) {
  return groupe && groupe.valide === true;
}

/**
 * ===========================================================
 * DIAGNOSTIC DE COHERENCE DES DONNEES
 *
 * A lancer AVANT un calcul de répartition, pour repérer les
 * problèmes de saisie qui provoquent des résultats silencieusement
 * faux (comme les vœux mal lus ou le mélange Homme/Femme qu'on a
 * dû corriger) plutôt que de les découvrir après coup.
 *
 * ===========================================================
 */
function diagnostiquerCoherenceDonnees(joueurs, creneaux, config) {
  const problemes = [];

  /*
    1) Noms de créneaux dupliqués

    Le nom du créneau est utilisé comme identifiant partout
    (vœux, verrouillage, export...). Deux créneaux qui partagent
    le même nom se font invisiblement concurrence.
  */

  const comptageNoms = {};

  (creneaux || []).forEach((c) => {
    const cle = cleComparaisonTexte(c.nom);

    if (!cle) return;

    comptageNoms[cle] = (comptageNoms[cle] || 0) + 1;
  });

  Object.keys(comptageNoms).forEach((cle) => {
    if (comptageNoms[cle] > 1) {
      problemes.push({
        type: "CRENEAU_DUPLIQUE",

        detail:
          'Le nom de créneau "' +
          cle +
          '" apparaît ' +
          comptageNoms[cle] +
          " fois dans l'onglet Creneaux (noms en doublon)",
      });
    }
  });

  /*
    2) Voeux ne correspondant à AUCUN créneau existant

    Signale une faute de frappe probable : le joueur a demandé
    un créneau qui n'existe pas (ou plus) sous ce nom exact.
  */

  const nomsCreneauxValides = new Set(
    (creneaux || [])
      .map((c) => cleComparaisonTexte(c.nom))
      .filter((n) => n !== ""),
  );

  (joueurs || []).forEach((j) => {
    (j.voeux || []).forEach((v) => {
      if (!nomsCreneauxValides.has(cleComparaisonTexte(v))) {
        problemes.push({
          type: "VOEU_INCONNU",

          detail:
            (j.nom || "") +
            " " +
            (j.prenom || "") +
            ' a demandé "' +
            v +
            '", qui ne correspond à aucun créneau existant (faute de frappe possible)',
        });
      }
    });
  });

  /*
    3) Poids de config invalides

    Un poids négatif ou non numérique produit un classement des
    candidats incohérent sans qu'aucune erreur ne remonte.
  */

  const clesPoids = [
    "Poids niveau",
    "Poids competition",
    "Poids age",
    "Poids sexe",
    "Poids categorie",
  ];

  clesPoids.forEach((cle) => {
    if (!config || !Object.prototype.hasOwnProperty.call(config, cle)) {
      return;
    }

    const valeur = config[cle];

    if (valeur === "" || valeur === null || valeur === undefined) {
      return;
    }

    const nombre = Number(valeur);

    if (!Number.isFinite(nombre) || nombre < 0) {
      problemes.push({
        type: "POIDS_INVALIDE",

        detail:
          '"' +
          cle +
          '" = "' +
          valeur +
          '" n\'est pas un nombre valide (doit être un nombre positif ou nul)',
      });
    }
  });

  return problemes;
}

/**
 * ===========================================================
 * EXPORT DIAGNOSTIC
 * ===========================================================
 */
function exporterDiagnostic(problemes) {
  const feuille = obtenirOuCreerFeuille(SHEETS.DIAGNOSTIC);

  feuille.clear();

  const lignes = [["Type", "Détail"]];

  if (!problemes || problemes.length === 0) {
    lignes.push(["Aucun problème détecté", ""]);
  } else {
    problemes.forEach((p) => {
      lignes.push([p.type, p.detail]);
    });
  }

  ecrireTableau(feuille, lignes);

  feuille.autoResizeColumns(1, 2);

  return feuille;
}
