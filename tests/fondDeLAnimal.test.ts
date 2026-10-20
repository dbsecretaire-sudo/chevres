import { describe, expect, it } from 'vitest';
import { FOND_FEMELLE, FOND_MALE, FOND_PETIT, fondDeLAnimal } from '@/features/accueil/services/fondDeLAnimal';
import { CATEGORIE_ANIMAL } from '@/shared/constants/cheptel';

describe('fondDeLAnimal', () => {
  it('donne vert aux petits, rose aux femelles adultes, bleu aux mâles adultes', () => {
    expect(fondDeLAnimal(CATEGORIE_ANIMAL.CABRIT)).toBe(FOND_PETIT);
    expect(fondDeLAnimal(CATEGORIE_ANIMAL.CHEVRE)).toBe(FOND_FEMELLE);
    expect(fondDeLAnimal(CATEGORIE_ANIMAL.BOUC)).toBe(FOND_MALE);
  });
  it('ne colore pas une catégorie qui n’est pas un animal', () => {
    expect(fondDeLAnimal(CATEGORIE_ANIMAL.TOUT)).toBeUndefined();
  });
});
