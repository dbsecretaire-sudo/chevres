import type { Sejour } from '@/features/gite/types';
import { nuitsDuSejour } from '@/shared/utils/calendrier';

/** Arrondi au centime. */
const arrondi = (montant: number): number => Math.round(montant * 100) / 100;

export interface TarifSejour {
  /** Chambres × nuits × prix d'une chambre par nuit. */
  hebergement: number;
  /** Le montant de la taxe de séjour, ajouté une fois à la réservation (zéro quand le suivi n'est pas activé). */
  taxe: number;
  /** Repas × prix d'un repas. */
  restauration: number;
  /** Ce que le locataire paie en tout. */
  total: number;
}

/** Le détail du prix d'un séjour à partir de ses chambres, nuits, repas, de la taxe de séjour et des tarifs. */
export function calculerTarif(p: {
  chambres: number;
  nuits: number;
  prixNuit: number;
  taxe: number;
  repas: number;
  prixRepas: number;
}): TarifSejour {
  const hebergement = arrondi(p.chambres * p.nuits * p.prixNuit);
  const taxe = arrondi(p.taxe);
  const restauration = arrondi(p.repas * p.prixRepas);
  return { hebergement, taxe, restauration, total: arrondi(hebergement + taxe + restauration) };
}

/**
 * Ce qu'un séjour enregistré a coûté. Un séjour d'avant le détail du prix n'a qu'un prix payé : on le compte tout
 * entier en hébergement.
 */
export function tarifDuSejour(sejour: Sejour): TarifSejour {
  const nuits = nuitsDuSejour(sejour.arrivee, sejour.depart).length;
  const restauration = arrondi((sejour.repas ?? 0) * (sejour.prixRepas ?? 0));
  const taxe = sejour.taxe ?? 0;
  const hebergement =
    sejour.prixNuit !== undefined
      ? arrondi(sejour.chambres.length * nuits * sejour.prixNuit)
      : arrondi(sejour.prix - taxe - restauration);
  return { hebergement, taxe, restauration, total: sejour.prix };
}
