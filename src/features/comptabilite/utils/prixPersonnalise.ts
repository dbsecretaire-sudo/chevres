import { parseDecimal } from '@/shared/utils/nombres';

/** Le prix unitaire d'une ligne : le prix personnalisé quand l'option est cochée et qu'un prix est saisi, sinon celui de l'inventaire. */
export const prixUnitaireEffectif = (
  e: { prixPersonnalise: boolean; prixUnitaireSaisi: string },
  prixInventaire: number | undefined,
): number | undefined => {
  const perso = e.prixPersonnalise ? parseDecimal(e.prixUnitaireSaisi) : 0;
  return perso > 0 ? perso : prixInventaire;
};
