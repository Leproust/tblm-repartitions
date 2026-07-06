class Joueur{

    constructor(){

        this.nom="";

        this.prenom="";

        this.age=0;

        this.categorie="";

        this.sexe="";

        this.classement="";

        this.niveau=0;

        this.anciennete=0;

        this.competition=false;

        this.nouveau=false;

        this.voeux=[];

        this.affectation=null;

    }

}

class Creneau{

    constructor(){

        this.nom="";

        this.jour="";

        this.heure="";

        this.categorie="";

        this.capacite=0;

        this.surbooking=0;

        this.actif=true;

        this.joueurs=[];

    }

}

class Parametres{

    constructor(){

        this.poidsAge=80;

        this.poidsNiveau=90;

        this.poidsSexe=15;

        this.poidsCategorie=90;

        this.prioriteNouveaux=false;

    }

}
