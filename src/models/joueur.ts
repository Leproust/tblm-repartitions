/**
 * ===========================================================
 * models/Joueur.gs
 *
 * Objet Joueur
 *
 * ===========================================================
 */

declare function convertirClassementFFT(classement: string | number): number;

class Joueur {
  licence: string;
  nom: string;
  prenom: string;
  categorie: string;
  sexe: string;
  age: number;
  classement: string;
  niveau: number;
  nouveau: boolean;
  competition: boolean;
  voeux: string[];
  affectation: string | null;
  priorite: number;
  verrouille: boolean;
  etat: string;
  repliCompetition: boolean;

  constructor(data: any = {}) {


    this.licence =
      data.licence || "";


    this.nom =
      data.nom || "";


    this.prenom =
      data.prenom || "";



    this.categorie =
      data.categorie || "";



    this.sexe =
      data.sexe || "";



    this.age =
      Number(data.age) || 0;



    this.classement =
      data.classement || "NC";



    this.niveau =
      data.niveau ||
      convertirClassementFFT(
        this.classement
      );



    this.nouveau =
      Boolean(data.nouveau);



    this.competition =
      Boolean(data.competition);



    this.voeux =
      data.voeux || [];



    this.affectation =
      null;



    this.priorite =
      0;



    this.verrouille =
      false;



    this.repliCompetition =
      false;



    this.etat =
      ETAT_JOUEUR.LIBRE;


  }



  estJeune(){


    return estJeune(
      this
    );


  }



  estAdulte(){


    return !this.estJeune();


  }



  ajouterVoeu(
    creneau
  ){


    this.voeux.push(
      creneau
    );


  }



  affecter(
    creneau
  ){


    this.affectation =
      creneau.nom;


    this.etat =
      ETAT_JOUEUR.AFFECTE;


  }


}