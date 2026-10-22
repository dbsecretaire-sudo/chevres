import { bilanAgritourisme } from '@/features/commercial/services/agritourisme';
import type { VisiteAgritourisme } from '@/features/commercial/types';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';
import { yearOf } from '@/shared/utils/dates';
import type { Facture } from '@/features/comptabilite/types';
import { ATELIER } from '@/shared/constants/ateliers';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';

/** Ce que la plaque du côté « Agritourisme » de l'accueil compte : les visites prévues, les visiteurs et les recettes de l'année. */
export interface CompteAgritourisme {
  aVenir: number;
  visiteurs: number;
  recettes: number;
  /** Les dépenses de l'atelier Agritourisme de l'année (les factures reçues rangées dans cet atelier : assurances, office de tourisme, flyers…). */
  depenses?: number;
}

/** Les dépenses de l'atelier Agritourisme : le total des factures reçues rangées dans cet atelier. */
export const depensesAgritourisme = (factures: readonly Pick<Facture, 'type' | 'atelier' | 'montant'>[]): number =>
  Math.round(
    factures
      .filter((f) => f.type === TYPE_FACTURE.RECUE && f.atelier === ATELIER.AGRITOURISME)
      .reduce((total, f) => total + f.montant, 0) * 100,
  ) / 100;

/** Les comptes d'une année : les visites prévues (pas encore faites), et le bilan des visites comptées (les annulées ne comptent pas). */
export function compterAgritourisme(visites: readonly VisiteAgritourisme[], annee: number): CompteAgritourisme {
  const deLAnnee = visites.filter((v) => yearOf(v.date) === annee);
  const bilan = bilanAgritourisme([...deLAnnee]);
  return {
    aVenir: deLAnnee.filter((v) => v.statut === STATUT_VISITE.PREVUE).length,
    visiteurs: bilan.visiteurs,
    recettes: bilan.recettes,
  };
}
