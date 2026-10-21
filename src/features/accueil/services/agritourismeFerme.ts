import { bilanAgritourisme } from '@/features/commercial/services/agritourisme';
import type { VisiteAgritourisme } from '@/features/commercial/types';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';
import { yearOf } from '@/shared/utils/dates';

/** Ce que la plaque du côté « Agritourisme » de l'accueil compte : les visites prévues, les visiteurs et les recettes de l'année. */
export interface CompteAgritourisme {
  aVenir: number;
  visiteurs: number;
  recettes: number;
}

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
