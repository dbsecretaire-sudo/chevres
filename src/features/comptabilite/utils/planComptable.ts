import type { TypeAide } from '@/features/comptabilite/types';
import { tauxImpositionDeLAide } from '@/shared/dictionnaire/tauxParProduit';
import { TYPE_AIDE } from '@/shared/constants/comptabilite';

/** Taux (0-100) réellement saisi pour une aide ; retombe sur la valeur par défaut si absent (anciens enregistrements). */
export function tauxImpositionAide(typeAide: TypeAide, taux?: number): number {
  if (taux !== undefined) return taux;
  return typeAide === TYPE_AIDE.AUTRE ? 0 : tauxImpositionDeLAide(typeAide);
}
