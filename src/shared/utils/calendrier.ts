import { HEURE_MIDI } from '@/shared/constants/temps';
import { toISODate } from '@/shared/utils/dates';

/** Une date ISO (AAAA-MM-JJ) décalée d'un nombre de jours (négatif pour reculer). */
export function ajouterJours(iso: string, jours: number): string {
  const date = new Date(`${iso}${HEURE_MIDI}`);
  date.setDate(date.getDate() + jours);
  return toISODate(date);
}
