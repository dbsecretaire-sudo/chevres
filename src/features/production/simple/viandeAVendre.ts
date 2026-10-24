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
