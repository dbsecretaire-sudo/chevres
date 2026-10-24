import type { Chevre } from '@/features/cheptel/types';
import type { Traitement } from '@/features/sante/types';
import { concerneLaBoucle } from '@/features/cheptel/utils/numerosBoucles';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';

/** Ce que protège un délai d'attente : le lait (livraison, fromage) ou la viande (vente, abattoir, consommation). */
export type TypeDelai = 'lait' | 'viande';

/** Ajoute des jours à une date AAAA-MM-JJ. */
export function ajouterJours(iso: string, jours: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

const joursDuDelai = (t: Pick<Traitement, 'delaiLaitJours' | 'delaiViandeJours'>, type: TypeDelai): number =>
  (type === 'lait' ? t.delaiLaitJours : t.delaiViandeJours) ?? 0;

/**
 * Le dernier jour du délai d'attente d'un traitement : la dernière prise plus le délai (en jours). Ce jour-là, le lait ou la viande est
 * encore interdit ; il n'est utilisable que le lendemain. Rien quand le traitement n'a pas de délai de ce genre.
 */
export function finDuDelai(
  t: Pick<Traitement, 'date' | 'dateFin' | 'delaiLaitJours' | 'delaiViandeJours'>,
  type: TypeDelai,
): string | undefined {
  const jours = joursDuDelai(t, type);
  return jours > 0 ? ajouterJours(t.dateFin || t.date, jours) : undefined;
}

/** Vrai quand le traitement concerne cet animal : il nomme sa boucle, ou c'est celui du troupeau entier. */
export const traitementConcerne = (t: Pick<Traitement, 'chevreNumeroBoucle'>, numeroBoucle: string | undefined): boolean =>
  !t.chevreNumeroBoucle?.trim() || concerneLaBoucle(t.chevreNumeroBoucle, numeroBoucle);

/** Un délai en cours : le traitement, ce qu'il protège et son dernier jour. */
export interface DelaiEnCours {
  traitement: Traitement;
  type: TypeDelai;
  fin: string;
}

/** Les délais d'attente en cours un jour donné (le traitement a commencé, son délai n'est pas fini), du plus long au plus court. */
export function delaisEnCours(traitements: Traitement[], jour: string): DelaiEnCours[] {
  const liste: DelaiEnCours[] = [];
  for (const traitement of traitements) {
    for (const type of ['lait', 'viande'] as const) {
      const fin = finDuDelai(traitement, type);
      if (fin && traitement.date <= jour && jour <= fin) liste.push({ traitement, type, fin });
    }
  }
  return liste.sort((a, b) => b.fin.localeCompare(a.fin));
}

/** Les délais d'attente d'un animal un jour donné : pour chaque type, celui qui finit le plus tard. */
export function delaisDeLAnimal(
  numeroBoucle: string | undefined,
  traitements: Traitement[],
  jour: string,
): Partial<Record<TypeDelai, DelaiEnCours>> {
  const resultat: Partial<Record<TypeDelai, DelaiEnCours>> = {};
  for (const delai of delaisEnCours(
    traitements.filter((t) => traitementConcerne(t, numeroBoucle)),
    jour,
  )) {
    const actuel = resultat[delai.type];
    if (!actuel || delai.fin > actuel.fin) resultat[delai.type] = delai;
  }
  return resultat;
}

/** Un animal en délai d'attente et le dernier jour de son délai. */
export interface AnimalEnDelai {
  animal: Chevre;
  fin: string;
  traitement: Traitement;
}

/**
 * Les animaux vivants en délai d'attente un jour donné pour ce type : pour le lait, les femelles seulement (seules elles en donnent).
 * Du délai qui finit le plus tard au plus tôt.
 */
export function animauxEnDelai(
  animaux: Chevre[],
  traitements: Traitement[],
  jour: string,
  type: TypeDelai,
): AnimalEnDelai[] {
  const resultat: AnimalEnDelai[] = [];
  for (const animal of animaux) {
    if (animal.statut !== STATUT_CHEVRE.VIVANTE) continue;
    if (type === 'lait' && animal.sexe !== SEXE.FEMELLE) continue;
    const delai = delaisDeLAnimal(animal.numeroBoucle, traitements, jour)[type];
    if (delai) resultat.push({ animal, fin: delai.fin, traitement: delai.traitement });
  }
  return resultat.sort((a, b) => b.fin.localeCompare(a.fin) || (a.animal.numeroBoucle ?? '').localeCompare(b.animal.numeroBoucle ?? ''));
}

/** Le plus tard des derniers jours d'une liste de délais (rien si elle est vide). */
export const finLaPlusTardive = (delais: { fin: string }[]): string | undefined =>
  delais.reduce<string | undefined>((plus, d) => (!plus || d.fin > plus ? d.fin : plus), undefined);
