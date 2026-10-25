import { describe, expect, it } from 'vitest';
import { lotsApresAnnulationAbattoir, lotsApresEnvoiAbattoir } from '@/features/berger/services/mouvement';
import type { LotAnimaux } from '@/features/settings/settings';

describe('le bon de livraison d’un envoi à l’abattoir', () => {
  it('crée le bon du jour avec la chèvre, marqué comme départ', () => {
    const lots = lotsApresEnvoiAbattoir([], '00463', '2026-10-25');
    expect(lots).toHaveLength(1);
    expect(lots[0]).toMatchObject({ depart: true, abattoir: '2026-10-25' });
    expect(lots[0].boucles).toBe('00463');
  });

  it('ajoute la chèvre au bon du même jour, sans en créer un second', () => {
    const premier = lotsApresEnvoiAbattoir([], '00463', '2026-10-25');
    const lots = lotsApresEnvoiAbattoir(premier, '00871', '2026-10-25');
    expect(lots).toHaveLength(1);
    expect(lots[0].boucles).toBe('00463, 00871');
  });

  it('annuler retire la chèvre du bon, et supprime le bon quand il ne reste rien', () => {
    const lots = lotsApresEnvoiAbattoir(lotsApresEnvoiAbattoir([], '00463', '2026-10-25'), '00871', '2026-10-25');
    const apresUne = lotsApresAnnulationAbattoir(lots, '00463', '2026-10-25');
    expect(apresUne[0].boucles).toBe('00871');
    expect(lotsApresAnnulationAbattoir(apresUne, '00871', '2026-10-25')).toEqual([]);
  });

  it('annuler ne touche pas aux lots qui ne sont pas un départ du même jour', () => {
    const autre: LotAnimaux = { id: 'x', nom: 'Lot de reproduction', boucles: '00463' };
    expect(lotsApresAnnulationAbattoir([autre], '00463', '2026-10-25')).toEqual([autre]);
  });
});
