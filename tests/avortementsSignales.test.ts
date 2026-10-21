import { describe, expect, it } from 'vitest';
import { nombreDAvortements, signalerUnAvortement } from '@/features/exploitation/services/lotsAnnuels';
import type { LotAnimaux } from '@/features/settings/settings';

describe('signaler un avortement', () => {
  const ids = ['a', 'b', 'c'];
  const nouvelId = () => ids.shift() ?? 'z';

  it('crée le lot de l’année et y met la femelle : un avortement', () => {
    const { lots, lot } = signalerUnAvortement([], 'FR1', 2026, nouvelId);
    expect(lots).toHaveLength(1);
    expect(lot.categorie).toBe('avortement');
    expect(nombreDAvortements(lot, 'FR1')).toBe(1);
  });

  it('un second signalement la même année compte un avortement de plus, sans doublon dans le lot', () => {
    let { lots } = signalerUnAvortement([], 'FR1', 2026, nouvelId);
    ({ lots } = signalerUnAvortement(lots, 'FR1', 2026, nouvelId));
    const lot = lots[0] as LotAnimaux;
    expect(lots).toHaveLength(1);
    expect(lot.boucles).toBe('FR1');
    expect(nombreDAvortements(lot, 'FR1')).toBe(2);
  });

  it('une autre année a son propre lot et son propre compte ; une autre femelle compte à part', () => {
    let { lots } = signalerUnAvortement([], 'FR1', 2025, nouvelId);
    ({ lots } = signalerUnAvortement(lots, 'FR1', 2026, nouvelId));
    ({ lots } = signalerUnAvortement(lots, 'FR2', 2026, nouvelId));
    expect(lots).toHaveLength(2);
    const deux = lots.find((l) => l.avortement === 2026) as LotAnimaux;
    expect(nombreDAvortements(deux, 'FR1')).toBe(1);
    expect(nombreDAvortements(deux, 'FR2')).toBe(1);
    expect(nombreDAvortements(deux, 'FR3')).toBe(0);
  });
});
