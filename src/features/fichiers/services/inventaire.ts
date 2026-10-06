import { lireArchiveDossiers } from '@/features/dossiers/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import { lireArchiveTrading } from '@/features/trading/repository';

/** Tous les fichiers joints de l'établissement : ceux des contenus des dossiers et les captures des trades. */
export async function toutesLesPieces(): Promise<PieceJointe[]> {
  const [dossiers, trading] = await Promise.all([lireArchiveDossiers(), lireArchiveTrading()]);
  return [
    ...dossiers.elements.flatMap((e) => e.fichiers ?? []),
    ...trading.trades.flatMap((t) => t.captures ?? []),
  ];
}
