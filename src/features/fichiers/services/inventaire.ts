import { lireArchiveDossiers } from '@/features/dossiers/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import type { Controle } from '@/features/exploitation/types';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { lireArchiveTrading } from '@/features/trading/repository';

/** Tous les fichiers joints de l'établissement : ceux des contenus des dossiers et les captures des trades et les analyses du contrôle laitier. */
export async function toutesLesPieces(): Promise<PieceJointe[]> {
  const [dossiers, trading, controles, visites] = await Promise.all([
    lireArchiveDossiers(),
    lireArchiveTrading(),
    loadAllYears(CATEGORIE_STOCKAGE.CONTROLES) as Promise<Controle[]>,
    loadAllYears(CATEGORIE_STOCKAGE.VISITES_VETERINAIRE),
  ]);
  return [
    ...dossiers.elements.flatMap((e) => e.fichiers ?? []),
    ...trading.trades.flatMap((t) => t.captures ?? []),
    ...visites.flatMap((v) => v.fichiers ?? []),
    ...controles.flatMap((c) => [
      ...(c.fichiers ?? []),
      ...(c.contenus ?? []).flatMap((contenu) => contenu.fichiers ?? []),
    ]),
  ];
}
