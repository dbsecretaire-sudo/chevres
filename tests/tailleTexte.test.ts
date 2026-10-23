import { describe, expect, it } from 'vitest';
import { tailleValide, tailleVoisine } from '@/shared/utils/tailleTexte';

describe('taille du texte', () => {
  it('une valeur absente ou fausse donne la taille normale', () => {
    expect(tailleValide(undefined)).toBe(1);
    expect(tailleValide('abc')).toBe(1);
    expect(tailleValide('1.3')).toBe(1.3);
    expect(tailleValide(1.2)).toBe(1.15);
  });

  it('agrandir ou réduire passe à la taille voisine, sans sortir de la liste', () => {
    expect(tailleVoisine(1, 1)).toBe(1.15);
    expect(tailleVoisine(1, -1)).toBe(0.85);
    expect(tailleVoisine(0.85, -1)).toBe(0.85);
    expect(tailleVoisine(1.45, 1)).toBe(1.45);
  });
});
