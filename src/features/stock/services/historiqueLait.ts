import { productionDeduite } from '@/features/stock/services/stock';
import type { ArchiveStock, MouvementStock } from '@/features/stock/types';
import { ORIGINE_MOUVEMENT } from '@/shared/constants/stock';

/** L'identifiant du « article » lait des mouvements de l'historique (le lait n'est pas un article du stock). */
export const CLE_LAIT = 'lait';

/**
 * Le lait de l'historique : ce qui a été produit (le journal de lait), utilisé pour les fromages et vendu. Tout ce qui est sorti a
 * forcément été produit : la balance automatique ajoute en production ce que le journal ne couvre pas, à la date de chaque sortie.
 */
export function mouvementsDuLait(
  archive: Pick<ArchiveStock, 'mouvements' | 'lait'>,
  ventesLait: { id: string; date: string; litres: number }[],
): MouvementStock[] {
  const ventes: MouvementStock[] = ventesLait.map((v) => ({
    id: v.id,
    article: CLE_LAIT,
    date: v.date,
    delta: -v.litres,
    origine: ORIGINE_MOUVEMENT.VENTE,
  }));
  const fabrications: MouvementStock[] = archive.mouvements
    .filter((m) => m.origine === ORIGINE_MOUVEMENT.MANUEL && m.delta > 0 && (m.litres ?? 0) > 0)
    .map((m) => ({
      id: `${m.id}:lait`,
      article: CLE_LAIT,
      date: m.date,
      delta: -(m.litres ?? 0),
      origine: ORIGINE_MOUVEMENT.FABRICATION,
    }));
  const notes: MouvementStock[] = archive.lait.map((l) => ({
    id: l.id,
    article: CLE_LAIT,
    date: l.date,
    delta: l.litres,
    origine: ORIGINE_MOUVEMENT.PRODUCTION,
  }));
  // La balance automatique : ce qui est sorti sans que le journal le couvre est ajouté en production, sortie par sortie.
  const deduits: MouvementStock[] = productionDeduite(
    archive.lait.reduce((total, l) => total + l.litres, 0),
    [...ventes, ...fabrications].map((m) => ({ id: m.id, date: m.date, litres: -m.delta })),
  ).map((d) => ({
    id: `balance:${d.id}`,
    article: CLE_LAIT,
    date: d.date,
    delta: d.litres,
    origine: ORIGINE_MOUVEMENT.BALANCE,
  }));
  return [...notes, ...deduits, ...fabrications, ...ventes];
}
