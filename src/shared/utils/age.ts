import type { ValeurDe } from '@/shared/constants/valeurDe';
import {
  HEURE_MINUIT,
  JOURS_PAR_SEMAINE,
  MOIS_PAR_AN,
  MS_PAR_JOUR,
  UNITE_DUREE,
} from '@/shared/constants/temps';
import { todayISO } from '@/shared/utils/dates';

export type UniteDuree = ValeurDe<typeof UNITE_DUREE>;

/** Une durée exprimée dans l'unité qui lui convient (28 jours, 16 semaines, 8 mois). */
export interface Duree {
  valeur: number;
  unite: UniteDuree;
}

/** Mois révolus entre deux dates (le mois n'est compté qu'une fois le jour du mois atteint). */
function moisRevolusEntre(debut: Date, fin: Date): number {
  const mois = (fin.getFullYear() - debut.getFullYear()) * MOIS_PAR_AN + (fin.getMonth() - debut.getMonth());
  return fin.getDate() < debut.getDate() ? mois - 1 : mois;
}

/** Vrai si l'animal né à cette date a atteint cet âge à la date de référence (aujourd'hui par défaut). */
export function ageAtteint(dateNaissance: string, duree: Duree, dateRef: string = todayISO()): boolean {
  const naissance = new Date(`${dateNaissance}${HEURE_MINUIT}`);
  const ref = new Date(`${dateRef}${HEURE_MINUIT}`);
  if (duree.unite === UNITE_DUREE.MOIS) return moisRevolusEntre(naissance, ref) >= duree.valeur;
  const jours = duree.unite === UNITE_DUREE.SEMAINES ? duree.valeur * JOURS_PAR_SEMAINE : duree.valeur;
  return Math.round((ref.getTime() - naissance.getTime()) / MS_PAR_JOUR) >= jours;
}

/** « 28 jours », « 16 semaines », « 8 mois » (« 1 jour », « 1 semaine » au singulier). */
export function libelleDuree({ valeur, unite }: Duree): string {
  const singulier = unite === UNITE_DUREE.MOIS ? unite : unite.slice(0, -1);
  return `${valeur} ${valeur > 1 ? unite : singulier}`;
}
