import type { ActiviteComptable, Facture, Vente } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especeParDefaut } from '@/shared/dictionnaire/animaux';

/**
 * Activité d'une facture. Les factures saisies avant le choix de l'activité sont rattachées à l'espèce par
 * défaut pour l'alimentation (propre à une espèce), et à l'activité commune pour le reste (carburant, impôts…).
 */
export function activiteFacture(f: Pick<Facture, 'activite' | 'categorieDepense'>): ActiviteComptable {
  if (f.activite) return f.activite;
  return f.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION ? especeParDefaut() : ACTIVITE_COMMUNE;
}

/** Activité d'une vente de production : toujours une espèce — l'espèce par défaut pour les anciennes ventes. */
export const activiteVente = (v: Pick<Vente, 'activite'>): ActiviteComptable =>
  v.activite ?? especeParDefaut();
