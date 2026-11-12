import { declarerStatutChevre, getChevre } from '@/features/cheptel/repository/chevres';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { idsDesAnimaux, sortieDesAnimauxDeLaVente } from '@/features/comptabilite/utils/ventes';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';

/**
 * Un animal désigné par une seule vente est sorti du cheptel : tant qu'il est vivant, il passe au statut de cette vente (vendu, à l'abattoir, mort).
 * La vente fait foi : une mise à jour venue d'un autre appareil, ou une vente modifiée, ne doit pas le laisser vivant. Un animal désigné par deux
 * ventes n'est pas touché : ce conflit se règle à la main. Rend le nombre d'animaux corrigés.
 */
export async function alignerLesStatutsSurLesVentes(): Promise<number> {
  const ventes = await listToutesVentes();
  const designations = new Map<string, number>();
  for (const v of ventes) {
    for (const id of idsDesAnimaux(v)) designations.set(id, (designations.get(id) ?? 0) + 1);
  }
  let corriges = 0;
  for (const v of ventes) {
    const sortie = sortieDesAnimauxDeLaVente(v);
    for (const id of idsDesAnimaux(v)) {
      if (designations.get(id) !== 1) continue;
      const animal = await getChevre(id);
      if (!animal || animal.statut !== STATUT_CHEVRE.VIVANTE) continue;
      await declarerStatutChevre(id, sortie.statut, sortie.date);
      corriges++;
    }
  }
  return corriges;
}
