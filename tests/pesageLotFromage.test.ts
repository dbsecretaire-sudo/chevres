import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import { etiquetteDuLot } from '@/features/stock/services/etiquetteLot';
import { enregistrerPeseeDuLot, fabriquerFromages } from '@/features/stock/services/lots';

describe('pesée d’une pièce de fromage à la vente', () => {
  it('le poids net et le prix de la pièce sont notés sur son lot, et figurent sur son étiquette', async () => {
    await fabriquerFromages({ article: 'fromage:frais', date: '2026-10-30', quantite: 1, debut: '700' });
    const lot = (await lireArchiveStock()).lots?.find((l) => l.numero === '700');
    expect(lot).toBeDefined();

    await enregistrerPeseeDuLot(lot!.id, 0.98, 8.5);

    const apres = (await lireArchiveStock()).lots?.find((l) => l.id === lot!.id);
    expect(apres?.poidsNetKg).toBe(0.98);
    expect(apres?.prixPiece).toBe(8.5);
    const etiquette = etiquetteDuLot(apres!, await lireArchiveStock());
    expect(etiquette.numero).toBe('700');
    expect(etiquette.poidsNetKg).toBe(0.98);
    expect(etiquette.prixPiece).toBe(8.5);
  });
});
