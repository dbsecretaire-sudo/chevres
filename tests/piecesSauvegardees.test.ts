import { describe, expect, it } from 'vitest';
import { enregistrerEtapeAccueil } from '@/features/commercial/repository';
import { toutesLesPieces } from '@/features/fichiers/services/inventaire';
import { enregistrerEtapeSavon } from '@/features/stock/services/lots';
import type { PieceJointe } from '@/features/fichiers/types';
import { ETAPE_ACCUEIL } from '@/shared/constants/agritourisme';
import { ETAPE_SAVON } from '@/shared/constants/stock';
import { updateSettings } from '@/features/settings/settings';

const piece = (id: string): PieceJointe => ({ id, nom: `${id}.pdf`, extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-22' });

describe('fichiers joints gardés par la sauvegarde et Google Drive', () => {
  it('reprennent les pièces du dossier d’un savon et celles du cadre réglementaire', async () => {
    await enregistrerEtapeSavon('savon:s1', ETAPE_SAVON.DIP, { fait: true, fichiers: [piece('dip-1')] });
    await enregistrerEtapeAccueil(ETAPE_ACCUEIL.ASSURANCE, { fait: true, fichiers: [piece('assurance-1')] });
    const ids = (await toutesLesPieces()).map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['dip-1', 'assurance-1']));
  });

  it('reprennent le bon d’un enlèvement, les pièces du cadre réglementaire de l’atelier, les documents du GDS et le document de circulation d’un bon de livraison', async () => {
    await updateSettings({
      exploitation: {
        enlevements: [{ id: 'e1', date: '2026-10-24', boucles: '12', fichiers: [piece('bon-enlevement')] }],
        cadreAtelier: { pms: { fait: true, fichiers: [piece('pms-1')] } },
        gds: { documents: { rapports_essais: [{ piece: piece('rapport-1'), deposeLe: '2026-10-24T10:00:00Z', visiteId: 'f1' }] } },
        lots: [{ id: 'l1', nom: 'Bon', boucles: '12', abattoir: '2026-10-24', documentCirculation: { piece: piece('circulation-1'), deposeLe: '2026-10-24T10:00:00Z' } }],
      },
    });
    const ids = (await toutesLesPieces()).map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['bon-enlevement', 'pms-1', 'rapport-1', 'circulation-1']));
  });
});
