import type { Sejour } from '@/features/gite/types';
import { nuitsDuSejour } from '@/shared/utils/calendrier';

/** Le séjour qui occupe une chambre cette nuit-là (l'arrivée comprise, le jour du départ exclu), s'il y en a un. */
export const sejourDeLaNuit = (sejours: Sejour[], chambre: number, nuit: string): Sejour | undefined =>
  sejours.find((s) => s.chambre === chambre && s.arrivee <= nuit && nuit < s.depart);

/** Pour chaque nuit, le nombre de chambres occupées (les nuits sans séjour n'y figurent pas). */
export function chambresOccupeesParNuit(sejours: Sejour[]): Map<string, number> {
  const parNuit = new Map<string, number>();
  for (const sejour of sejours) {
    for (const nuit of nuitsDuSejour(sejour.arrivee, sejour.depart)) {
      parNuit.set(nuit, (parNuit.get(nuit) ?? 0) + 1);
    }
  }
  return parNuit;
}

/** Le séjour qui gêne une réservation : une autre réservation de la même chambre sur une des mêmes nuits. */
export const sejourEnConflit = (
  sejours: Sejour[],
  chambre: number,
  arrivee: string,
  depart: string,
  ignorerId?: string,
): Sejour | undefined =>
  sejours.find(
    (s) => s.id !== ignorerId && s.chambre === chambre && s.arrivee < depart && arrivee < s.depart,
  );
