/**
 * ===========================================================
 * models/Creneau.gs
 *
 * Objet Creneau
 *
 * ===========================================================
 */

class Creneau {
  nom: string;
  jour: string;
  heure: string;
  categorie: string;
  effectif: number;
  capacite: number;
  surbooking: number;
  actif: boolean;
  joueurs: any[];
  verrouille: boolean;

  constructor(data: any = {}){


    this.nom =
      data.nom || "";


    this.jour =
      data.jour || "";


    this.heure =
      data.heure || "";



    this.categorie =
      data.categorie || "";



    this.effectif =
      Number(data.effectif ?? data.capacite) || 0;



    this.capacite =
      this.effectif;



    this.surbooking =
      Number(data.surbooking) || 0;



    this.actif =
      data.actif !== false;



    this.joueurs =
      [];



    this.verrouille =
      false;


  }



  capaciteMax(){


    return (
      this.effectif +
      this.surbooking
    );


  }



  placesDisponibles(){


    return (

      this.capaciteMax()
      -
      this.joueurs.length

    );


  }



  estComplet(){


    return (
      this.placesDisponibles()
      <=
      0
    );


  }



  ajouterJoueur(
    joueur
  ){


    this.joueurs.push(
      joueur
    );


    joueur.affecter(
      this
    );


  }


}