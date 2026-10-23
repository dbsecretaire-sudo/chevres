import { describe, expect, it } from 'vitest';
import { balanceDesEcritures, texteDeBalance } from '@/features/comptabilite/services/balanceDesEcritures';

describe('balance en face du titre d’un intervenant', () => {
  it('recettes moins dépenses', () => {
    expect(
      balanceDesEcritures([
        { sens: 'entree', montantComptabilise: 100 },
        { sens: 'sortie', montantComptabilise: 20 },
        { sens: 'sortie' },
      ]),
    ).toBe(80);
    expect(balanceDesEcritures([])).toBe(0);
  });

  it('le texte porte son signe, sans mot', () => {
    expect(texteDeBalance(80)).toMatch(/^\+80,00\s?€$/);
    expect(texteDeBalance(-12.5)).toMatch(/^-12,50\s?€$/);
  });
});
