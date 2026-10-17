import type { Chevre, ReservationAnimal } from '@/features/cheptel/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';

/** Vrai quand l'animal est réservé et pas encore parti (un animal vendu, mort… n'est plus à réserver). */
export const estReserve = (animal: Pick<Chevre, 'reservation' | 'statut'>): boolean =>
  !!animal.reservation && (animal.statut === STATUT_CHEVRE.VIVANTE || animal.statut === STATUT_CHEVRE.ABATTOIR);

/** L'animal réservé pour ce client (par un bon de commande si `commandeId` est donné). */
export function reserver(animal: Chevre, reservation: ReservationAnimal): Chevre {
  return { ...animal, reservation };
}

/** L'animal libéré : il est de nouveau disponible. */
export function liberer(animal: Chevre): Chevre {
  const { reservation: _reservation, ...reste } = animal;
  return reste as Chevre;
}

/** Les animaux réservés par un bon de commande. */
export const reservesDeLaCommande = (animaux: Chevre[], commandeId: string): Chevre[] =>
  animaux.filter((a) => estReserve(a) && a.reservation?.commandeId === commandeId);

/** Les animaux qu'un bon de commande peut réserver : ceux de la liste qui ne sont réservés pour personne (ou déjà pour cette commande). */
export const disponiblesPourLaCommande = (animaux: Chevre[], commandeId?: string): Chevre[] =>
  animaux.filter((a) => !estReserve(a) || (!!commandeId && a.reservation?.commandeId === commandeId));
