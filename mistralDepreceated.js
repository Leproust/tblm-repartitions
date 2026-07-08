// ============================================
// Outil de Répartition de Groupes de Tennis
// Version finale avec gestion du surbooking et joueurs sans créneau
// ============================================
const SHEET_LICENCIES = "Licencies";
const SHEET_CRENEAUX = "Creneaux";
const SHEET_GROUPES = "Groupes";
const SHEET_CONFIG = "Config";

// --- FONCTION PRINCIPALE ---
function genererGroupes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const licencies = lireLicencies(ss);
  const creneaux = lireCreneaux(ss);
  const config = lireConfig(ss);

  // 1. Créer les groupes principaux
  const groupesPrincipaux = [];
  const joueursDejaPlaces = new Set();

  // Trier les créneaux par jour et heure
  const creneauxTries = [...creneaux].sort((a, b) => {
    const joursOrder = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
    if (joursOrder[a.jour] !== joursOrder[b.jour]) {
      return joursOrder[a.jour] - joursOrder[b.jour];
    }
    return a.heure.localeCompare(b.heure);
  });

  // 2. Assigner les joueurs aux groupes principaux
  for (const creneau of creneauxTries) {
    if (creneau.actif !== "Oui") continue;

    const joueursDispo = licencies.filter(j =>
      j.disponibilites.includes(creneau.nom) &&
      j.categorie === creneau.categorie &&
      !joueursDejaPlaces.has(j.licence)
    );

    if (joueursDispo.length > 0) {
      const groupesCreneau = repartirEnGroupes(joueursDispo, creneau.effectif, 4);
      groupesCreneau.forEach(g => {
        g.creneau = creneau.nom;
        g.jour = creneau.jour;
        g.heure = creneau.heure;
        g.categorie = creneau.categorie;
        g.type = "Principal";
        g.joueurs.forEach(j => joueursDejaPlaces.add(j.licence));
        groupesPrincipaux.push(g);
      });
    }
  }

  // 3. Gérer le surbooking
  const groupesSurbooking = [];
  for (const creneau of creneauxTries) {
    if (creneau.actif !== "Oui" || creneau.surbooking === 0) continue;

    const joueursDispo = licencies.filter(j =>
      j.disponibilites.includes(creneau.nom) &&
      j.categorie === creneau.categorie
    );

    if (joueursDispo.length > 0) {
      const groupesCreneau = repartirEnGroupes(joueursDispo, creneau.surbooking, 4);
      groupesCreneau.forEach(g => {
        g.creneau = creneau.nom;
        g.jour = creneau.jour;
        g.heure = creneau.heure;
        g.categorie = creneau.categorie;
        g.type = "Surbooking";
        groupesSurbooking.push(g);
      });
    }
  }

  // 4. Fusionner les groupes
  const tousLesGroupes = [...groupesPrincipaux, ...groupesSurbooking];

  // 5. Écrire les résultats
  ecrireGroupes(ss, tousLesGroupes);

  // 6. Trouver les joueurs sans créneau
  const joueursSansCreneauCount = trouverJoueursSansCreneau(ss, licencies, creneaux);

  SpreadsheetApp.getUi().alert("✅ " + tousLesGroupes.length + " groupes générés !\n\n" +
    groupesPrincipaux.length + " groupes principaux\n" +
    groupesSurbooking.length + " groupes en surbooking\n" +
    joueursSansCreneauCount + " joueurs sans créneau → Voir onglet 'Sans Créneau'");
}

// --- LECTURE DES CRÉNEAUX ---
function lireCreneaux(ss) {
  const sheet = ss.getSheetByName(SHEET_CRENEAUX);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const creneaux = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    creneaux.push({
      nom: row[0].trim(),
      jour: row[1].trim(),
      heure: row[2].trim(),
      categorie: row[3].trim(),
      effectif: parseInt(row[4]) || 0,
      surbooking: parseInt(row[5]) || 0,
      actif: row[6].trim()
    });
  }

  return creneaux;
}

// --- LECTURE DES LICENCIÉS ---
function lireLicencies(ss) {
  const sheet = ss.getSheetByName(SHEET_LICENCIES);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const licencies = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue;

    const disponibilites = [];
    for (let j = 12; j <= 16; j++) {
      const dispo = row[j]?.toString().trim();
      if (dispo) disponibilites.push(dispo);
    }

    licencies.push({
      nouveauAdherent: row[0] === "TRUE" || row[0] === true,
      licence: row[1]?.toString().trim() || "",
      nom: row[2]?.toString().trim() || "",
      prenom: row[3]?.toString().trim() || "",
      categorie: row[4]?.toString().trim() || "",
      dateNaissance: row[5]?.toString().trim() || "",
      age: row[6] ? parseFloat(row[6]) : 0,
      sexe: row[7]?.toString().trim() || "",
      classement: row[8]?.toString().trim() || "",
      anneeTennis: row[9] ? parseInt(row[9]) : 0,
      meilleurClassement: row[10]?.toString().trim() || "",
      competition: row[11] === "TRUE" || row[11] === true,
      disponibilites: disponibilites
    });
  }

  return licencies;
}

// --- LECTURE DE LA CONFIG ---
function lireConfig(ss) {
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) return {
    poidsNiveau: 50,
    poidsAge: 20,
    poidsSexe: 15,
    poidsCategorie: 10,
    prioriteNouveaux: true
  };

  const data = sheet.getDataRange().getValues();
  const config = {};
  for (const row of data) {
    if (row[0] && row[1] !== "" && row[1] !== null) {
      const param = row[0].trim();
      const value = row[1];
      if (param === "Poids niveau") config.poidsNiveau = parseInt(value) || 50;
      else if (param === "Poids age") config.poidsAge = parseInt(value) || 20;
      else if (param === "Poids sexe") config.poidsSexe = parseInt(value) || 15;
      else if (param === "Poids catégorie") config.poidsCategorie = parseInt(value) || 10;
      else if (param === "Priorite nouveaux") config.prioriteNouveaux = value === "Oui" || value === true;
    }
  }
  return {
    poidsNiveau: config.poidsNiveau || 50,
    poidsAge: config.poidsAge || 20,
    poidsSexe: config.poidsSexe || 15,
    poidsCategorie: config.poidsCategorie || 10,
    prioriteNouveaux: config.prioriteNouveaux || true
  };
}

// --- RÉPARTIR EN GROUPES ---
function repartirEnGroupes(joueurs, maxJoueurs, tailleGroupe) {
  if (joueurs.length === 0) return [];

  // ✅ NOUVEAU : Trier différemment selon la catégorie
  const joueursTries = [...joueurs].sort((a, b) => {
    // Pour les catégories Primaire/College : trier par âge d'abord
    if (joueurs[0].categorie === "Primaire" || joueurs[0].categorie === "College") {
      return Math.abs(a.age - b.age); // Trier par âge (plus proche = meilleur)
    }
    // Pour les autres catégories : trier par niveau
    return valeurClassement(a.classement) - valeurClassement(b.classement);
  });

  const groupes = [];
  let joueursRestants = [...joueursTries];
  const nombreGroupes = Math.min(
    Math.ceil(joueursRestants.length / tailleGroupe),
    Math.floor(maxJoueurs / tailleGroupe)
  );

  for (let i = 0; i < nombreGroupes; i++) {
    const tailleGroupeReelle = Math.min(
      tailleGroupe,
      joueursRestants.length,
      maxJoueurs - (i * tailleGroupe)
    );

    if (tailleGroupeReelle <= 0) break;

    const groupe = joueursRestants.splice(0, tailleGroupeReelle);
    groupes.push({
      joueurs: groupe,
      niveauMoyen: calculerNiveauMoyen(groupe),
      aNouveaux: groupe.filter(j => j.nouveauAdherent).length,
      enCompetition: groupe.filter(j => j.competition).length,
      index: i
    });
  }

  return groupes;
}


// --- FONCTIONS UTILITAIRES ---
function valeurClassement(classement) {
  if (!classement || classement === "NC") return 1000;
  const match = classement.match(/^(\d+)\/(\d+)$/);
  if (match) return parseInt(match[1]) / parseInt(match[2]);
  if (classement.includes("15")) return 15;
  if (classement.includes("30")) return 30;
  if (classement.includes("45")) return 45;
  if (classement.includes("40")) return 60;
  return 1000;
}

function calculerNiveauMoyen(groupe) {
  const moyenne = groupe.map(j => valeurClassement(j.classement)).reduce((a, b) => a + b, 0) / groupe.length;
  if (moyenne >= 60) return "NC";
  if (moyenne >= 45) return "60";
  if (moyenne >= 30) return "45";
  if (moyenne >= 15) return "30";
  return Math.round(moyenne) + "/2";
}

// --- ÉCRITURE DES GROUPES ---
// --- ÉCRITURE DES GROUPES (CORRIGÉE) ---
function ecrireGroupes(target, groupes) {
  // Si target est un Spreadsheet, récupérer la feuille "Groupes"
  let sheet;
  if (target.getSheets) {
    // C'est un Spreadsheet
    sheet = target.getSheetByName(SHEET_GROUPES);
    if (!sheet) {
      sheet = target.insertSheet(SHEET_GROUPES);
      sheet.setTabColor("#4CAF50");
    } else {
      sheet.clear();
    }
  } else {
    // C'est déjà un Sheet
    sheet = target;
    sheet.clear();
  }

  const headers = [
    "Groupe", "Type", "Créneau", "Jour", "Heure", "Catégorie", "Effectif",
    "Niveau moyen", "Âge moyen", "Nouveaux", "Compétition"
  ];
  for (let i = 1; i <= 4; i++) headers.push("Joueur " + i);

  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f0f0f0");

  for (const groupe of groupes) {
    const ageMoyen = groupe.joueurs.reduce((sum, j) => sum + j.age, 0) / groupe.joueurs.length;
    const row = [
      "Groupe " + (groupe.index + 1) + (groupe.type === "Surbooking" ? " (S)" : ""),
      groupe.type,
      groupe.creneau,
      groupe.jour,
      groupe.heure,
      groupe.categorie,
      groupe.joueurs.length,
      calculerNiveauMoyen(groupe.joueurs),
      Math.round(ageMoyen * 10) / 10,
      groupe.aNouveaux,
      groupe.enCompetition
    ];

    for (let j = 0; j < 4; j++) {
      const joueur = groupe.joueurs[j];
      const nomComplet = joueur ? joueur.prenom + " " + joueur.nom : "";
      const nouveau = joueur?.nouveauAdherent ? " 🆕" : "";
      const competition = joueur?.competition ? " 🏆" : "";
      row.push(nomComplet + nouveau + competition);
    }

    sheet.appendRow(row);
  }

  sheet.autoResizeColumns(1, headers.length);
}



// --- JOUEURS SANS CRÉNEAU ---
function trouverJoueursSansCreneau(ss, licencies, creneaux) {
  const creneauxActifs = creneaux.filter(c => c.actif === "Oui").map(c => c.nom);

  const joueursSansCreneau = licencies.filter(j => {
    return !j.disponibilites.some(dispo => creneauxActifs.includes(dispo));
  });

  let sheet = ss.getSheetByName("Sans Créneau");
  if (!sheet) {
    sheet = ss.insertSheet("Sans Créneau");
    sheet.setTabColor("#FF5722");
  } else {
    sheet.clear();
  }

  sheet.appendRow(["Licence", "Nom", "Prénom", "Catégorie", "Classement", "Disponibilités"]);
  sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f0f0f0");

  joueursSansCreneau.forEach(j => {
    sheet.appendRow([
      j.licence,
      j.nom,
      j.prenom,
      j.categorie,
      j.classement,
      j.disponibilites.join(", ") || "Aucune"
    ]);
  });

  sheet.autoResizeColumns(1, 6);
  return joueursSansCreneau.length;
}

// --- MENU ---
function onOpenOLD() {
  SpreadsheetApp.getUi().createMenu('🎾 Tennis Répartition')
    .addItem('⚡ Générer les groupes', 'genererGroupes')
    .addItem('📊 Statistiques', 'showStats')
    .addItem('🔍 Places disponibles', 'afficherPlacesDisponibles')
    .addSeparator()
    .addItem('✅ Valider des groupes', 'validerGroupes')
    .addItem('🔄 Relancer répartition', 'relancerRepartition')
    .addSeparator()
    .addItem('❓ Aide', 'showHelp')
    .addToUi();
}



function showStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const licencies = lireLicencies(ss);
  const creneaux = lireCreneaux(ss);

  let statsHTML = '<div style="padding:20px;font-family:Arial"><h2>📊 Statistiques</h2>';

  statsHTML += '<h3>Par Catégorie</h3><table border="1" style="border-collapse:collapse"><tr><th>Catégorie</th><th>Nombre</th><th>% Total</th></tr>';
  const categories = {};
  licencies.forEach(j => categories[j.categorie] = (categories[j.categorie] || 0) + 1);
  for (const cat in categories) {
    const pourcent = Math.round((categories[cat] / licencies.length) * 100);
    statsHTML += `<tr><td>${cat}</td><td>${categories[cat]}</td><td>${pourcent}%</td></tr>`;
  }
  statsHTML += '</table><br>';

  statsHTML += '<h3>Par Créneau</h3><table border="1" style="border-collapse:collapse"><tr><th>Créneau</th><th>Catégorie</th><th>Effectif Max</th><th>Surbooking</th><th>Demande</th></tr>';
  creneaux.forEach(c => {
    if (c.actif !== "Oui") return;
    const demande = licencies.filter(j => j.disponibilites.includes(c.nom)).length;
    statsHTML += `<tr><td>${c.nom}</td><td>${c.categorie}</td><td>${c.effectif}</td><td>${c.surbooking}</td><td>${demande}</td></tr>`;
  });
  statsHTML += '</table></div>';

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(statsHTML)
      .setWidth(900)
      .setHeight(600),
    'Statistiques'
  );
}

function showHelp() {
  const helpHTML = '<div style="padding:20px;font-family:Arial"><h2>🎾 Aide</h2>' +
    '<h3>Fonctionnement:</h3>' +
    '<ol>' +
    '<li><strong>Groupes principaux</strong> : Chaque joueur est placé dans 1 groupe par créneau disponible (selon sa catégorie).</li>' +
    '<li><strong>Surbooking</strong> : Si un créneau a du surbooking autorisé, des joueurs supplémentaires peuvent être ajoutés.</li>' +
    '<li><strong>Équilibrage</strong> : Les groupes sont équilibrés par niveau, âge et sexe.</li>' +
    '</ol>' +
    '<h3>Exemple:</h3>' +
    '<p>Un joueur disponible <strong>Lundi 17H</strong> (Primaire) et <strong>Mardi 18H</strong> (Primaire) sera placé dans :</p>' +
    '<ul>' +
    '<li>1 groupe principal (ex: Lundi 17H)</li>' +
    '<li>1 groupe en surbooking (ex: Mardi 18H, si surbooking autorisé)</li>' +
    '</ul>' +
    '<h3>Personnalisation:</h3>' +
    '<p>Crée un onglet <strong>Config</strong> pour ajuster les poids des critères.</p>' +
    '</div>';

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(helpHTML)
      .setWidth(700)
      .setHeight(500),
    'Aide'
  );
}

// ============================================
// NOUVELLES FONCTIONNALITÉS
// ============================================

// --- AFFICHER LES CRÉNEAUX NON PLEINS + PLACES DISPONIBLES ---
function afficherPlacesDisponibles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const groupesSheet = ss.getSheetByName(SHEET_GROUPES);
  if (!groupesSheet) {
    SpreadsheetApp.getUi().alert("❌ Onglet 'Groupes' introuvable !");
    return;
  }

  const creneaux = lireCreneaux(ss);
  const groupesData = groupesSheet.getDataRange().getValues();

  // Compter les joueurs par créneau (principal + surbooking)
  const creneauxCount = {};
  for (let i = 1; i < groupesData.length; i++) {
    const row = groupesData[i];
    const creneau = row[2]; // Colonne C: Créneau
    const type = row[1];   // Colonne B: Type (Principal/Surbooking)
    const effectif = row[6]; // Colonne G: Effectif

    if (!creneau) continue;
    if (!creneauxCount[creneau]) creneauxCount[creneau] = { principal: 0, surbooking: 0 };

    if (type === "Principal") creneauxCount[creneau].principal += effectif;
    else if (type === "Surbooking") creneauxCount[creneau].surbooking += effectif;
  }

  // Créer l'onglet "Places Disponibles"
  let sheet = ss.getSheetByName("Places Disponibles");
  if (!sheet) {
    sheet = ss.insertSheet("Places Disponibles");
    sheet.setTabColor("#2196F3");
  } else {
    sheet.clear();
  }

  // Écrire les en-têtes
  sheet.appendRow(["Créneau", "Jour", "Heure", "Catégorie", "Effectif Max", "Surbooking Max", "Joueurs Principaux", "Joueurs Surbooking", "Places Disponibles (Principal)", "Places Disponibles (Total)"]);
  sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f0f0f0");

  // Écrire les données
  creneaux.forEach(c => {
    if (c.actif !== "Oui") return;

    const count = creneauxCount[c.nom] || { principal: 0, surbooking: 0 };
    const placesPrincipalesDispo = Math.max(0, c.effectif - count.principal);
    const placesTotalDispo = Math.max(0, c.effectif + c.surbooking - count.principal - count.surbooking);

    sheet.appendRow([
      c.nom,
      c.jour,
      c.heure,
      c.categorie,
      c.effectif,
      c.surbooking,
      count.principal,
      count.surbooking,
      placesPrincipalesDispo,
      placesTotalDispo
    ]);
  });

  sheet.autoResizeColumns(1, 10);
  SpreadsheetApp.getUi().alert("✅ Onglet 'Places Disponibles' généré !");
}

// --- VALIDER DES JOUEURS/GROUPES ---
function validerGroupes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const groupesSheet = ss.getSheetByName(SHEET_GROUPES);
  if (!groupesSheet) {
    SpreadsheetApp.getUi().alert("❌ Onglet 'Groupes' introuvable !");
    return;
  }

  // Ajouter une colonne "Validé" si elle n'existe pas
  const headers = groupesSheet.getRange(1, 1, 1, groupesSheet.getLastColumn()).getValues()[0];
  let validatedColIndex = headers.indexOf("Validé");
  if (validatedColIndex === -1) {
    validatedColIndex = groupesSheet.getLastColumn();
    groupesSheet.getRange(1, validatedColIndex + 1).setValue("Validé");
    // Mettre "Non" par défaut pour tous les groupes existants
    const lastRow = groupesSheet.getLastRow();
    if (lastRow > 1) {
      groupesSheet.getRange(2, validatedColIndex + 1, lastRow - 1, 1).setValue("Non");
    }
  } else {
    validatedColIndex++; // Passer à l'index 1-based
  }

  SpreadsheetApp.getUi().alert("✅ Colonne 'Validé' ajoutée !\n\n" +
    "1. Coche 'Oui' dans cette colonne pour valider un groupe\n" +
    "2. Exécute 'Relancer répartition' pour recalculer avec le reste");
}

// --- RELANCER LA RÉPARTITION AVEC LES NON-VALIDÉS ---
function relancerRepartition() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const groupesSheet = ss.getSheetByName(SHEET_GROUPES);
  if (!groupesSheet) {
    SpreadsheetApp.getUi().alert("❌ Onglet 'Groupes' introuvable !");
    return;
  }

  // Lire les groupes validés
  const groupesData = groupesSheet.getDataRange().getValues();
  const validatedColIndex = groupesData[0].indexOf("Validé");
  if (validatedColIndex === -1) {
    SpreadsheetApp.getUi().alert("❌ Colonne 'Validé' introuvable ! Exécute d'abord 'Valider groupes'");
    return;
  }

  // Récupérer les licences des joueurs validés
  const licenciesValidees = new Set();
  for (let i = 1; i < groupesData.length; i++) {
    const row = groupesData[i];
    if (row[validatedColIndex] === "Oui") {
      // Extraire les licences des joueurs dans ce groupe (colonnes 11 à 14)
      for (let j = 11; j <= 14; j++) {
        const joueurCell = row[j];
        if (joueurCell && joueurCell !== "") {
          // Extraire la licence du joueur (format: "Nom Prénom 🆕 🏆")
          const nomPrenom = joueurCell.replace(" 🆕", "").replace(" 🏆", "").trim();
          const joueur = lireLicencies(ss).find(j => (j.prenom + " " + j.nom).trim() === nomPrenom);
          if (joueur) licenciesValidees.add(joueur.licence);
        }
      }
    }
  }

  // Lire tous les licenciés et filtrer ceux non validés
  const tousLicencies = lireLicencies(ss);
  const licenciesNonValidees = tousLicencies.filter(j => !licenciesValidees.has(j.licence));

  // Lire les créneaux
  const creneaux = lireCreneaux(ss);
  const config = lireConfig(ss);

  // Générer de nouveaux groupes avec les joueurs non validés
  const nouveauxGroupes = [];
  const joueursDejaPlaces = new Set();

  // Trier les créneaux
  const creneauxTries = [...creneaux].sort((a, b) => {
    const joursOrder = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
    if (joursOrder[a.jour] !== joursOrder[b.jour]) {
      return joursOrder[a.jour] - joursOrder[b.jour];
    }
    return a.heure.localeCompare(b.heure);
  });

  // Créer les groupes principaux
  for (const creneau of creneauxTries) {
    if (creneau.actif !== "Oui") continue;

    const joueursDispo = licenciesNonValidees.filter(j =>
      j.disponibilites.includes(creneau.nom) &&
      j.categorie === creneau.categorie &&
      !joueursDejaPlaces.has(j.licence)
    );

    if (joueursDispo.length > 0) {
      const groupesCreneau = repartirEnGroupes(joueursDispo, creneau.effectif, 4);
      groupesCreneau.forEach(g => {
        g.creneau = creneau.nom;
        g.jour = creneau.jour;
        g.heure = creneau.heure;
        g.categorie = creneau.categorie;
        g.type = "Principal";
        g.joueurs.forEach(j => joueursDejaPlaces.add(j.licence));
        nouveauxGroupes.push(g);
      });
    }
  }

  // Créer les groupes en surbooking
  for (const creneau of creneauxTries) {
    if (creneau.actif !== "Oui" || creneau.surbooking === 0) continue;

    const joueursDispo = licenciesNonValidees.filter(j =>
      j.disponibilites.includes(creneau.nom) &&
      j.categorie === creneau.categorie
    );

    if (joueursDispo.length > 0) {
      const groupesCreneau = repartirEnGroupes(joueursDispo, creneau.surbooking, 4);
      groupesCreneau.forEach(g => {
        g.creneau = creneau.nom;
        g.jour = creneau.jour;
        g.heure = creneau.heure;
        g.categorie = creneau.categorie;
        g.type = "Surbooking";
        nouveauxGroupes.push(g);
      });
    }
  }

  // Écrire les nouveaux groupes dans un nouvel onglet
  let newSheet = ss.getSheetByName("Nouveaux Groupes");
  if (!newSheet) {
    newSheet = ss.insertSheet("Nouveaux Groupes");
    newSheet.setTabColor("#FFC107");
  } else {
    newSheet.clear();
  }

  ecrireGroupes(newSheet, nouveauxGroupes);
  SpreadsheetApp.getUi().alert("✅ " + nouveauxGroupes.length + " nouveaux groupes générés dans l'onglet 'Nouveaux Groupes' !");
}