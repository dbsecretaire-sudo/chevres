import { estReserve } from '@/features/cheptel/services/reservations';
import type { Chevre } from '@/features/cheptel/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';

/** Les animaux sans boucle à vendre : vivants ou déjà à l'abattoir, qu'aucune vente ne désigne et qu'aucun client n'a réservés (le plus récent d'abord). */
export function animauxSansBoucleAVendre(cheptel: Chevre[], idsVendus: ReadonlySet<string>): Chevre[] {
  return cheptel
    .filter(
      (a) =>
        !a.numeroBoucle?.trim() &&
        (a.statut === STATUT_CHEVRE.VIVANTE || a.statut === STATUT_CHEVRE.ABATTOIR) &&
        !idsVendus.has(a.id) &&
        !estReserve(a),
    )
    .sort((a, b) => b.dateNaissance.localeCompare(a.dateNaissance));
}

/** L'âge d'un animal en jours entiers à une date (AAAA-MM-JJ) : rien si sa naissance est inconnue ou après cette date. */
export function joursDeVie(dateNaissance: string | undefined, aujourdhui: string): number | undefined {
  if (!dateNaissance) return undefined;
  const jours = Math.floor((Date.parse(`${aujourdhui}T12:00:00Z`) - Date.parse(`${dateNaissance.slice(0, 10)}T12:00:00Z`)) / 86_400_000);
  return Number.isFinite(jours) && jours >= 0 ? jours : undefined;
}
