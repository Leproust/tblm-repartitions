declare function construireIndex(headers: any[]): Record<string, number>;
declare function ligneVide(ligne: any[]): boolean;
declare function lireTexte(valeur: any): string;
declare function lireNombre(valeur: any): number;
declare function lireBoolean(valeur: any): boolean;
declare function nettoyerClassement(valeur: any): string;
/**
 * ===========================================================
 * Types partagés
 *
 * Reflètent la vraie forme des objets manipulés à l'exécution
 * (construits comme des littéraux dans lecteur.service.ts), PAS
 * les classes Joueur/Creneau de models/ qui ne sont jamais
 * instanciées (`new Joueur(...)` / `new Creneau(...)` n'apparaît
 * nulle part dans le projet — code mort à supprimer un jour).
 *
 * Point de départ d'un typage progressif : appliqué pour l'instant
 * aux fichiers les plus centraux (contraintes.ts, scoreV2.ts).
 * À étendre au reste du projet au fil de l'eau plutôt que d'un coup.
 * ===========================================================
 */
interface JoueurData {
  licence: string;
  nom: string;
  prenom: string;
  categorie: string;
  sexe: string;
  age: number;
  classement: string;
  niveau: number;
  anciennete?: number;
  meilleurClassement?: string;
  nouveau: boolean;
  competition: boolean;
  voeux: string[];
  affectation: string | null;
  priorite?: number;
  verrouille?: boolean;
  repliCompetition?: boolean;
  score?: number;
}

interface CreneauData {
  nom: string;
  jour?: string;
  heure?: string;
  categorie: string;
  effectif: number;
  capacite?: number;
  surbooking: number;
  actif?: boolean;
  joueurs: JoueurData[];
  verrouille?: boolean;
}

declare function obtenirOuCreerFeuille(nom: string): any;
declare function sauvegarderFeuilleAvantEcrasement(nomFeuille: string, maxBackups?: number): any;
declare function viderFeuille(nom: string): void;
declare function ecrireTableau(feuille: any, donnees: any[][]): void;
declare function affecterJoueursV2(joueurs: any[], creneaux: any[], config: any): any;
declare function optimiserRepartition(creneaux: any[], parametres: any): void;
declare function optimisationComplete(creneaux: any[], config?: any): void;
declare function analyserAffectation(creneaux: any[]): any;
declare function chargerContexte(): any;
declare function diagnostiquerCoherenceDonnees(joueurs: any[], creneaux: any[], config: any): any[];
declare function exporterDiagnostic(problemes: any[]): any;
declare function controlerJoueurs(joueurs: any[]): any[];
declare function enrichirJoueurs(joueurs: any[]): any[];
declare function chargerGroupesDepuisFeuille(joueurs: any[], creneaux: any[], options?: { onlyFixed?: boolean }): any[];
declare function genererStatistiques(joueurs: any[], creneaux: any[]): any;
declare function exporterStatistiques(stats: any): void;
declare function exporterRapport(creneaux: any[], stats: any): void;
declare function initialiserJournal(): void;
declare function debutChrono(nom: string): void;
declare function finChrono(nom: string): number;
declare function journalInfo(etape: string, message: string, valeur?: unknown): void;
declare function journalResume(joueurs: any[], creneaux: any[]): void;
declare function afficherErreurs(erreurs: string[]): void;
declare function journaliser(etape: string, message: string, valeur?: unknown, niveau?: string): void;
declare function journalErreur(etape: string, message: string, valeur?: unknown): void;
declare function journalDebug(etape: string, message: string, valeur?: unknown): void;
declare function arrondir(nombre: number, decimales: number): number;
declare function niveauMoyen(creneaux: any[]): number;
declare function calculerAge(dateNaissance: any): number;
declare function ecartType(tableau: any[], fonction: (item: any) => number): number;
declare function dispersionNiveau(joueurs: any[]): number;
declare function pourcentage(partie: number, total: number): number;
declare function estJeune(joueur: any): boolean;
