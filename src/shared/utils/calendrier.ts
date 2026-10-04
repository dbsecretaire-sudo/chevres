import { HEURE_MIDI } from '@/shared/constants/temps';
import { JOURS_PAR_SEMAINE_CALENDRIER } from '@/shared/constants/gite';
import { toISODate } from '@/shared/utils/dates';

/** Un mois du calendrier : l'année et le mois de 0 (janvier) à 11. */
export interface MoisCalendrier {
  annee: number;
  mois: number;
}

/** Une date ISO (AAAA-MM-JJ) décalée d'un nombre de jours (négatif pour reculer). */
export function ajouterJours(iso: string, jours: number): string {
  const date = new Date(`${iso}${HEURE_MIDI}`);
  date.setDate(date.getDate() + jours);
  return toISODate(date);
}

/** Le mois d'une date ISO. */
export function moisDe(iso: string): MoisCalendrier {
  const date = new Date(`${iso}${HEURE_MIDI}`);
  return { annee: date.getFullYear(), mois: date.getMonth() };
}

/** Le mois précédent (-1) ou suivant (+1). */
export function decalerMois({ annee, mois }: MoisCalendrier, decalage: number): MoisCalendrier {
  const date = new Date(annee, mois + decalage, 1, 12);
  return { annee: date.getFullYear(), mois: date.getMonth() };
}

/**
 * Les semaines d'un mois pour le calendrier (le lundi en premier) : chaque semaine compte sept cases, une date ISO
 * ou null pour les jours qui n'appartiennent pas au mois.
 */
export function semainesDuMois(annee: number, mois: number): (string | null)[][] {
  const premier = new Date(annee, mois, 1, 12);
  const nombreDeJours = new Date(annee, mois + 1, 0).getDate();
  // getDay() : 0 = dimanche ; on ramène le lundi à 0.
  const decalage = (premier.getDay() + 6) % JOURS_PAR_SEMAINE_CALENDRIER;

  const cases: (string | null)[] = [
    ...Array<null>(decalage).fill(null),
    ...Array.from({ length: nombreDeJours }, (_, i) => toISODate(new Date(annee, mois, i + 1, 12))),
  ];
  while (cases.length % JOURS_PAR_SEMAINE_CALENDRIER !== 0) cases.push(null);

  const semaines: (string | null)[][] = [];
  for (let i = 0; i < cases.length; i += JOURS_PAR_SEMAINE_CALENDRIER) {
    semaines.push(cases.slice(i, i + JOURS_PAR_SEMAINE_CALENDRIER));
  }
  return semaines;
}

/** Les nuits d'un séjour : de l'arrivée jusqu'à la veille du départ. */
export function nuitsDuSejour(arrivee: string, depart: string): string[] {
  const nuits: string[] = [];
  for (let nuit = arrivee; nuit < depart; nuit = ajouterJours(nuit, 1)) nuits.push(nuit);
  return nuits;
}
