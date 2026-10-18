import type { Chevre } from '@/features/cheptel/types';
import type { Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';

/**
 * Les animaux « vendus » ou « à l'abattoir » que plus aucune vente ne porte (la facture a été supprimée, ou l'animal n'en a jamais eu) :
 * ceux qu'on peut remettre vivants dans le cheptel. Un animal à l'abattoir qu'on n'a pas encore facturé en fait partie : c'est à vous de
 * choisir, la liste ne coche rien d'office. Du plus récemment sorti au plus ancien.
 */
export function animauxSansVente(animaux: Chevre[], ventes: Vente[]): Chevre[] {
  const dansUneVente = new Set(ventes.flatMap((v) => idsDesAnimaux(v)));
  return animaux
    .filter(
      (a) =>
        (a.statut === STATUT_CHEVRE.VENDUE || a.statut === STATUT_CHEVRE.ABATTOIR) && !dansUneVente.has(a.id),
    )
    .sort((a, b) => (b.dateStatut ?? '').localeCompare(a.dateStatut ?? ''));
}
