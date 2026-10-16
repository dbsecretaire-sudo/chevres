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
  /** Les animaux nés pendant l'année d'avant : ceux encore présents, vendus ou consommés (les morts et les mort-nés n'y sont pas). */
  nes: number;
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
 * nombre d'animaux nés l'année d'avant (encore présents, vendus ou autoconsommés ; sans les morts ni les mort-nés).
 */
export function recensementAnnuel(animaux: Chevre[], annee: number): Recensement {
  const premierJanvier = `${annee}-01-01`;
  const debutAnneeAvant = `${annee - 1}-01-01`;
  let femelles = 0;
  let males = 0;
  let nes = 0;
  for (const animal of animaux) {
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
    // Né l'année d'avant, et pas mort : encore présent, vendu ou consommé.
    if (animal.dateNaissance >= debutAnneeAvant && animal.dateNaissance < premierJanvier) {
      const mort = animal.statut === STATUT_CHEVRE.MORTE;
      if (!mort) nes += 1;
    }
  }
  return { annee, femelles, males, nes };
}
