import { describe, expect, it } from 'vitest';
import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { surChangement } from '@/shared/storage/localStore';

describe('prévenir quand une écriture est enregistrée', () => {
  it('prévient pour une facture enregistrée, même sans passer par un écran, puis cesse après le désabonnement', async () => {
    const vues: string[] = [];
    const arreter = surChangement((categorie) => vues.push(categorie));
    await enregistrerFacture({
      date: '2026-05-01',
      type: TYPE_FACTURE.EMISE,
      tiers: 'Groupe',
      montant: 120,
      description: 'Visite',
    } as Parameters<typeof enregistrerFacture>[0]);
    expect(vues).toContain(CATEGORIE_STOCKAGE.FACTURES);
    const avant = vues.length;
    arreter();
    await enregistrerFacture({
      date: '2026-05-02',
      type: TYPE_FACTURE.EMISE,
      tiers: 'Groupe',
      montant: 50,
      description: 'Visite',
    } as Parameters<typeof enregistrerFacture>[0]);
    expect(vues).toHaveLength(avant);
  });

  it('un écouteur en défaut ne fait pas échouer l’enregistrement', async () => {
    const arreter = surChangement(() => {
      throw new Error('en défaut');
    });
    await expect(
      enregistrerFacture({
        date: '2026-05-03',
        type: TYPE_FACTURE.EMISE,
        tiers: 'Groupe',
        montant: 10,
        description: 'Visite',
      } as Parameters<typeof enregistrerFacture>[0]),
    ).resolves.toBeDefined();
    arreter();
  });
});
