import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import type { Chevre } from '@/features/cheptel/types';

/**
 * Vrai quand un animal compte dans les documents qui dénombrent les cabris (carnet de mise bas, bilan annuel, suivi des mouvements,
 * recensement) : un animal sans boucle n'est pas compté, sauf quand il a été auto-consommé (il est né et sorti de l'exploitation).
 */
export const compteAuxDocuments = (c: Pick<Chevre, 'numeroBoucle' | 'statut'>): boolean =>
  !!c.numeroBoucle?.trim() || c.statut === STATUT_CHEVRE.AUTOCONSOMMEE;
