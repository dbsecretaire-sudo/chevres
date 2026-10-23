import { describe, expect, it } from 'vitest';
import { enregistrerEtapeAccueil } from '@/features/commercial/repository';
import { toutesLesPieces } from '@/features/fichiers/services/inventaire';
import { enregistrerEtapeSavon } from '@/features/stock/services/lots';
import type { PieceJointe } from '@/features/fichiers/types';
import { ETAPE_ACCUEIL } from '@/shared/constants/agritourisme';
import { ETAPE_SAVON } from '@/shared/constants/stock';

const piece = (id: string): PieceJointe => ({ id, nom: `${id}.pdf`, extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-22' });

describe('fichiers joints gardés par la sauvegarde et Google Drive', () => {
  it('reprennent les pièces du dossier d’un savon et celles du cadre réglementaire', async () => {
    await enregistrerEtapeSavon('savon:s1', ETAPE_SAVON.DIP, { fait: true, fichiers: [piece('dip-1')] });
    await enregistrerEtapeAccueil(ETAPE_ACCUEIL.ASSURANCE, { fait: true, fichiers: [piece('assurance-1')] });
    const ids = (await toutesLesPieces()).map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['dip-1', 'assurance-1']));
  });
});
