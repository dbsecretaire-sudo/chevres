import { describe, expect, it } from 'vitest';
import { partsDeLaVente } from '@/features/comptabilite/utils/ventes';
import { fraisDuLotPourLaVente } from '@/features/exploitation/services/lots';

describe('frais d’abattoir refacturés', () => {
  it('une vente sans frais n’a qu’une part ; avec frais, la viande puis les frais à leur taux', () => {
    expect(partsDeLaVente({ prix: 100, tauxTva: 10 })).toEqual([{ ttc: 100, taux: 10 }]);
    expect(partsDeLaVente({ prix: 129.09, tauxTva: 10, fraisAbattoir: 29.09, tauxTvaFrais: 20 })).toEqual([
      { ttc: 100, taux: 10 },
      { ttc: 29.09, taux: 20 },
    ]);
    // Sans taux propre, les frais suivent celui de la vente ; des frais plus grands que le prix ne le dépassent pas.
    expect(partsDeLaVente({ prix: 50, tauxTva: 10, fraisAbattoir: 80 })).toEqual([
      { ttc: 0, taux: 10 },
      { ttc: 50, taux: 10 },
    ]);
  });

  it('la part des frais d’un lot qui revient à la vente : tout si elle prend tous les animaux, sinon au prorata', () => {
    const lot = { boucles: '1, 2, 3, 4', fraisAbattoir: 229.09 };
    expect(fraisDuLotPourLaVente(lot, 4)).toBe(229.09);
    expect(fraisDuLotPourLaVente(lot, 1)).toBe(57.27);
    expect(fraisDuLotPourLaVente(lot, 10)).toBe(229.09);
    expect(fraisDuLotPourLaVente({ boucles: '1, 2' }, 2)).toBeUndefined();
    expect(fraisDuLotPourLaVente(undefined, 2)).toBeUndefined();
  });

  it('le montant de l’abattoir est fixe : les bêtes écartées ne le réduisent pas', () => {
    const lot = { boucles: '1, 2, 3, 4, 5', fraisAbattoir: 190.32 };
    // 4 bêtes à facturer sur 5 (une morte pendant le transport) : la vente qui les prend toutes paie toute la facture.
    expect(fraisDuLotPourLaVente(lot, 4, 1)).toBe(190.32);
    // Vendu à deux clients : réparti entre les bêtes à facturer.
    expect(fraisDuLotPourLaVente(lot, 2, 1)).toBe(95.16);
  });
});
