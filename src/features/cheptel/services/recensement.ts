import type { Chevre } from '@/features/cheptel/types';
import { moisEntre } from '@/features/cheptel/services/tableauDeBord';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';

/** L'âge (en mois) à partir duquel les animaux comptent dans le recensement : les plus de 6 mois. */
export const MOIS_RECENSEMENT = 6;

/** Ce que demande le recensement annuel des ovins et caprins (règlement CE 21/2004), au 1er janvier d'une année. */
export interface Recensement {
  /** L'année du recensement : les effectifs sont ceux du 1er janvier de cette année. */
  annee: number;
  /** Les animaux de plus de 6 mois au 1er janvier : femelles, et mâles (les boucs ou les béliers). */
  femelles: number;
  males: number;
  /** Les animaux nés pendant l'année d'avant, avec une boucle : ceux encore présents, vendus, consommés ou morts sur l'exploitation, comme le demande le formulaire (les mort-nés et les petits sans boucle n'y sont pas). */
  nes: number;
  /** De quoi retrouver le chiffre du bilan annuel : tous les petits nés l'année d'avant, dont ceux sans boucle (qui ne comptent pas dans `nes`) et ceux morts (qui y comptent). */
  nesTotal: number;
  nesSansBoucle: number;
  nesMorts: number;
}

/** Les statuts qui retirent un animal du troupeau, avec une date de sortie. */
const STATUTS_DE_SORTIE: readonly string[] = [
  STATUT_CHEVRE.MORTE,
  STATUT_CHEVRE.ABATTOIR,
  STATUT_CHEVRE.VENDUE,
  STATUT_CHEVRE.AUTOCONSOMMEE,
];

/** Vrai quand l'animal est sorti du troupeau (mort, vendu, abattu, consommé) avant ce jour, ce jour compris : il n'y est plus ce jour-là. */
const sortiAvant = (animal: Chevre, jour: string): boolean =>
  STATUTS_DE_SORTIE.includes(animal.statut) && !!animal.dateStatut && animal.dateStatut <= jour;

/**
 * Le recensement du 1er janvier d'une année d'après le cheptel : les animaux de plus de 6 mois ce jour-là (femelles et mâles), et le
 * nombre d'animaux nés l'année d'avant (encore présents, vendus ou autoconsommés ; sans les morts, les mort-nés ni les petits sans boucle).
 */
export function recensementAnnuel(animaux: Chevre[], annee: number): Recensement {
  const premierJanvier = `${annee}-01-01`;
  const debutAnneeAvant = `${annee - 1}-01-01`;
  let femelles = 0;
  let males = 0;
  let nes = 0;
  let nesTotal = 0;
  let nesSansBoucle = 0;
  let nesMorts = 0;
  for (const animal of animaux) {
    // Les petits nés l'année d'avant : tous, puis ceux qui ne comptent pas (sans boucle, morts).
    if (animal.dateNaissance >= debutAnneeAvant && animal.dateNaissance < premierJanvier) {
      nesTotal += 1;
      if (!animal.numeroBoucle?.trim()) nesSansBoucle += 1;
      else if (animal.statut === STATUT_CHEVRE.MORTE || animal.statut === STATUT_CHEVRE.MORT_NE) nesMorts += 1;
    }
    if (animal.statut === STATUT_CHEVRE.MORT_NE) continue;
    // Présent ce jour-là, et assez âgé.
    if (
      animal.dateNaissance < premierJanvier &&
      !sortiAvant(animal, premierJanvier) &&
      moisEntre(animal.dateNaissance, premierJanvier) >= MOIS_RECENSEMENT
    ) {
      if (animal.sexe === SEXE.FEMELLE) femelles += 1;
      else males += 1;
    }
    // Né l'année d'avant, avec une boucle : encore présent, vendu, consommé ou mort sur l'exploitation (les mort-nés sont déjà écartés).
    if (
      animal.numeroBoucle?.trim() &&
      animal.dateNaissance >= debutAnneeAvant &&
      animal.dateNaissance < premierJanvier
    ) {
      nes += 1;
    }
  }
  return { annee, femelles, males, nes, nesTotal, nesSansBoucle, nesMorts };
}
