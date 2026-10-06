import type { Sejour } from '@/features/gite/types';
import { nuitsDuSejour } from '@/shared/utils/calendrier';

/** Le séjour qui occupe une chambre cette nuit-là (l'arrivée comprise, le jour du départ exclu), s'il y en a un. */
export const sejourDeLaNuit = (sejours: Sejour[], chambre: number, nuit: string): Sejour | undefined =>
  sejours.find((s) => s.chambres.includes(chambre) && s.arrivee <= nuit && nuit < s.depart);

/** Pour chaque nuit, le nombre de chambres occupées (les nuits sans séjour n'y figurent pas). */
export function chambresOccupeesParNuit(sejours: Sejour[]): Map<string, number> {
  const parNuit = new Map<string, number>();
  for (const sejour of sejours) {
    for (const nuit of nuitsDuSejour(sejour.arrivee, sejour.depart)) {
      parNuit.set(nuit, (parNuit.get(nuit) ?? 0) + sejour.chambres.length);
    }
  }
  return parNuit;
}

/** Les chambres déjà prises sur au moins une des nuits entre l'arrivée et le départ (hors le séjour qu'on modifie). */
export function chambresIndisponibles(
  sejours: Sejour[],
  arrivee: string,
  depart: string,
  ignorerId?: string,
): Set<number> {
  const prises = new Set<number>();
  for (const s of sejours) {
    if (s.id === ignorerId || !(s.arrivee < depart && arrivee < s.depart)) continue;
    for (const chambre of s.chambres) prises.add(chambre);
  }
  return prises;
}

/** Les nuits où au moins un séjour n'est pas encore payé (à signaler dans les calendriers). */
export function nuitsAvecPaiementEnAttente(sejours: Sejour[]): Set<string> {
  const nuits = new Set<string>();
  for (const sejour of sejours) {
    if (sejour.paye) continue;
    for (const nuit of nuitsDuSejour(sejour.arrivee, sejour.depart)) nuits.add(nuit);
  }
  return nuits;
}

/**
 * Le séjour qui gêne une réservation : une autre réservation qui partage une des chambres demandées sur une des mêmes
 * nuits, avec les chambres en cause.
 */
export function sejourEnConflit(
  sejours: Sejour[],
  chambres: number[],
  arrivee: string,
  depart: string,
  ignorerId?: string,
): { sejour: Sejour; chambres: number[] } | undefined {
  for (const s of sejours) {
    if (s.id === ignorerId || !(s.arrivee < depart && arrivee < s.depart)) continue;
    const communes = chambres.filter((c) => s.chambres.includes(c));
    if (communes.length > 0) return { sejour: s, chambres: communes };
  }
  return undefined;
}
