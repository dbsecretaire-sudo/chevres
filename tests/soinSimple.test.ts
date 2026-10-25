import { describe, expect, it } from 'vitest';
import { messageDelaiLait } from '@/features/berger/services/soin';

describe('le délai d’attente du lait après un soin', () => {
  it('donne la date jusqu’à laquelle le lait ne va pas à la fromagerie', () => {
    expect(messageDelaiLait('2026-10-25', 7)).toBe('Pas de lait pour la fromagerie jusqu’au 01/11/2026.');
  });

  it('sans délai, rien à afficher', () => {
    expect(messageDelaiLait('2026-10-25', 0)).toBeUndefined();
  });
});
