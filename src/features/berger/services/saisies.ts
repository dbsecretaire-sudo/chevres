import { getChevre, listChevresVivantes, saveChevre, supprimerChevre } from '@/features/cheptel/repository/chevres';
import { enregistrerNaissance, type CabritInput } from '@/features/cheptel/repository/naissances';
import type { Chevre } from '@/features/cheptel/types';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { todayISO } from '@/shared/utils/dates';

/** L'animal vivant qui porte cette boucle, parmi ceux donnés ; rien quand aucun ne la porte. */
export const animalDeLaBoucle = (animaux: readonly Chevre[], boucle: string): Chevre | undefined =>
  animaux.find((a) => a.statut === STATUT_CHEVRE.VIVANTE && a.numeroBoucle?.trim() === boucle.trim());

/** Les nombres de petits proposés en gros boutons : de 1 au maximum d'une mise bas. */
export const nombresDePetits = (maximum: number): number[] => Array.from({ length: Math.max(1, maximum) }, (_, i) => i + 1);

/**
 * Les petits d'une naissance saisie sur le terrain : on ne connaît que leur nombre. Leur sexe est mis à femelle d'office, et chacun est marqué « à compléter » :
 * la secrétaire règle le sexe et les boucles à la maison.
 */
export const petitsDuBerger = (nombre: number): CabritInput[] =>
  Array.from({ length: Math.max(1, nombre) }, () => ({ sexe: SEXE.FEMELLE, aCompleter: true }));

/** La fiche d'un animal mort, saisie sur le terrain : morte au jour donné, à compléter (la cause, l'enlèvement) à la maison. */
export const animalMort = (animal: Chevre, date: string): Chevre => ({
  ...animal,
  statut: STATUT_CHEVRE.MORTE,
  dateStatut: date,
  aCompleter: true,
});

/** Les animaux vivants du troupeau (de l'espèce courante), où chercher la boucle scannée. */
export const animauxDuTroupeau = (): Promise<Chevre[]> => listChevresVivantes();

/** Enregistre une naissance : `nombre` petits de la mère, nés le jour du scan. Rend les petits créés (de quoi l'annuler). */
export async function enregistrerUneNaissance(mere: Chevre, nombre: number, date: string = todayISO()): Promise<Chevre[]> {
  return enregistrerNaissance({
    date,
    mereId: mere.id,
    mereNumeroBoucle: (mere.numeroBoucle ?? '').trim(),
    cabrits: petitsDuBerger(nombre),
  });
}

/** Annule une naissance qu'on vient d'enregistrer : ses petits sont retirés. */
export async function annulerUneNaissance(petits: readonly Chevre[]): Promise<void> {
  for (const p of petits) await supprimerChevre(p.id);
}

/** Enregistre la mort d'un animal, au jour du scan. Rend sa fiche d'avant (de quoi l'annuler). */
export async function enregistrerUneMort(animal: Chevre, date: string = todayISO()): Promise<Chevre> {
  const avant = (await getChevre(animal.id)) ?? animal;
  await saveChevre(animalMort(avant, date));
  return avant;
}

/** Annule une mort qu'on vient d'enregistrer : la fiche redevient telle qu'elle était. */
export async function annulerUneMort(avant: Chevre): Promise<void> {
  await saveChevre(avant);
}
