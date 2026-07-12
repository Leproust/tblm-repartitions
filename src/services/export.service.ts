/**
 * ===========================================================
 * export.gs
 *
 * Export des groupes dans Google Sheets
 *
 * Génère une vue exploitable par :
 *
 * - responsables du club
 * - entraîneurs
 * - affichage adhérents
 *
 * ===========================================================
 */


/**
 * Point d'entrée principal
 */
function exporterGroupes(
  creneaux,
  config
){

  sauvegarderFeuilleAvantEcrasement(
    SHEETS.GROUPES
  );


  const feuille =
    obtenirOuCreerFeuille(
      SHEETS.GROUPES
    );


  viderFeuille(
    SHEETS.GROUPES
  );


  const lignes =
    construireTableauExport(
      creneaux,
      config
    );


  ecrireTableau(
    feuille,
    lignes
  );


  mettreEnFormeExport(
    feuille,
    lignes.length
  );


  return feuille;

}



/**
 * ===========================================================
 * CONSTRUCTION TABLEAU
 * ===========================================================
 */
/**
 * ===========================================================
 * ALTERNATIVE SUGGEREE
 *
 * Pour faciliter les ajustements manuels du coach : sur chaque
 * ligne, indique le meilleur AUTRE créneau où ce joueur pourrait
 * aussi aller (parmi ceux qui respectent les mêmes contraintes
 * que l'affectation d'origine — catégorie, âge, compétition...).
 *
 * Pas de duplication de ligne : juste une information en plus
 * sur la ligne existante, donc aucun risque de fausser les
 * compteurs (occupation, statistiques) par un double comptage.
 * ===========================================================
 */
function trouverAlternative(joueur, creneauActuel, creneaux, config) {
  const autres = creneaux.filter((c) => c !== creneauActuel);

  const possibles = creneauxPossibles(joueur, autres);

  if (possibles.length === 0) {
    return "";
  }

  const classement = possibles.map((c) => ({
    creneau: c,
    score: calculerScoreV2(joueur, c, config),
  }));

  classement.sort((a, b) => b.score - a.score);

  return classement[0].creneau.nom;
}

/**
 * ===========================================================
 * CONSTRUCTION DU TABLEAU
 * ===========================================================
 */
function construireTableauExport(
  creneaux,
  config = undefined
){

  const lignes=[];


  /*
    Entête
  */

  lignes.push([

    "Créneau",

    "Catégorie",

    "Nom",

    "Prénom",

    "Licence",

    "Age",

    "Classement",

    "Niveau",

    "Sexe",

    "Compétition",

    "Nouveau",

    "Fixé",

    "Repli",

    "Alternative suggérée"

  ]);



  creneaux.forEach(
    creneau=>{


      /*
        Groupe vide
      */

      if(
        creneau.joueurs.length===0
      ){

        lignes.push([

          creneau.nom,

          creneau.categorie,

          "Aucun joueur",

          "",

          "",

          "",

          "",

          "",

          "",

          "",

          "",

          "",

          "",

          ""

        ]);


        return;

      }



      creneau.joueurs
      .forEach(
        joueur=>{


          lignes.push([

            creneau.nom,

            creneau.categorie,

            joueur.nom,

            joueur.prenom,

            joueur.licence,

            joueur.age,

            joueur.classement,

            joueur.niveau,

            joueur.sexe,

            joueur.competition
              ?
              "Oui"
              :
              "Non",

            joueur.nouveau
              ?
              "Oui"
              :
              "Non",

            joueur.verrouille
              ?
              "Oui"
              :
              "Non",

            joueur.repliCompetition
              ?
              "Oui"
              :
              "Non",

            joueur.verrouille
              ?
              ""
              :
              trouverAlternative(joueur, creneau, creneaux, config)

          ]);


        }
      );


      /*
        Ligne séparation
      */

      lignes.push([

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        "",

        ""

      ]);


    }
  );


  return lignes;

}



/**
 * ===========================================================
 * MISE EN FORME
 * ===========================================================
 */
function mettreEnFormeExport(
  feuille,
  nombreLignes
){

  if(
    nombreLignes<1
  )
    return;



  const nombreColonnes = feuille.getLastColumn() || 10;



  /*
    Entête
  */

  feuille
  .getRange(
    1,
    1,
    1,
    nombreColonnes
  )
  .setFontWeight(
    "bold"
  );



  /*
    Largeur automatique
  */

  feuille
  .autoResizeColumns(
    1,
    nombreColonnes
  );



  /*
    Figer entête
  */

  feuille
  .setFrozenRows(
    1
  );



  /*
    Bordures
  */

  feuille
  .getRange(
    1,
    1,
    nombreLignes,
    nombreColonnes
  )
  .setBorder(
    true,
    true,
    true,
    true,
    true,
    true
  );

}



/**
 * ===========================================================
 * EXPORT DETAIL PAR CRENEAU
 * ===========================================================
 */
function exporterVueEntraineur(
  creneaux
){

  const ss =
    SpreadsheetApp
    .getActive();



  creneaux.forEach(
    creneau=>{


      const nom =
        nettoyerNomFeuille(
          creneau.nom
        );



      let feuille =
        ss.getSheetByName(
          nom
        );



      if(!feuille){

        feuille =
          ss.insertSheet(
            nom
          );

      }
      else{

        feuille.clear();

      }



      const lignes=[

        [

          "Créneau",

          creneau.nom

        ],

        [

          "Catégorie",

          creneau.categorie

        ],

        [

          ""

        ],

        [

          "Nom",

          "Prénom",

          "Age",

          "Classement"

        ]

      ];



      creneau.joueurs
      .forEach(
        joueur=>{


          lignes.push([

            joueur.nom,

            joueur.prenom,

            joueur.age,

            joueur.classement

          ]);

        }
      );



      ecrireTableau(
        feuille,
        lignes
      );


      feuille
      .autoResizeColumns(
        1,
        4
      );


    }
  );

}



/**
 * ===========================================================
 * EXPORT CSV
 * ===========================================================
 */
function exporterCSV(
  creneaux
){

  const lignes =
    construireTableauExport(
      creneaux
    );


  return lignes
    .map(
      ligne=>
      ligne
      .map(
        cellule=>
        '"' +
        String(cellule)
        .replace(
          /"/g,
          '""'
        )
        +
        '"'
      )
      .join(";")
    )
    .join("\n");

}



/**
 * ===========================================================
 * NOM FEUILLE
 * ===========================================================
 */
function nettoyerNomFeuille(
  nom
){

  return nom
    .replace(
      /[:\\\/\?\*\[\]]/g,
      "-"
    )
    .substring(
      0,
      90
    );

}



/**
 * ===========================================================
 * SYNTHESE GROUPES
 * ===========================================================
 */
function genererSynthese(
  creneaux
){

  const resultat=[];


  resultat.push([

    "Créneau",

    "Catégorie",

    "Effectif",

    "Age moyen",

    "Niveau moyen"

  ]);



  creneaux.forEach(
    c=>{


      resultat.push([

        c.nom,

        c.categorie,

        c.joueurs.length,

        arrondir(
          moyenne(
            c.joueurs,
            j=>j.age
          ),
          1
        ),


        arrondir(
          niveauMoyen(
            c.joueurs
          ),
          1
        )

      ]);

    }
  );


  return resultat;

}

/**
 * ===========================================================
 * RAPPORT COMPLET
 * ===========================================================
 *
 * Fonction appelée par "Générer rapport" et "Rejouer la
 * répartition" mais qui n'existait pas encore (plantage
 * garanti à l'exécution). Implémentation minimale :
 * - une feuille "Rapport" avec la synthèse par créneau
 * - une feuille par créneau pour la vue entraîneur
 *
 * `stats` n'est pas encore exploité ici : à enrichir si le
 * rapport doit aussi reprendre le détail des statistiques.
 */
function exporterRapport(creneaux, stats) {
  const feuille = obtenirOuCreerFeuille(SHEETS.RAPPORT);

  viderFeuille(SHEETS.RAPPORT);

  const lignes = genererSynthese(creneaux);

  ecrireTableau(feuille, lignes);

  feuille.autoResizeColumns(1, lignes[0].length);

  exporterVueEntraineur(creneaux);

  return feuille;
}