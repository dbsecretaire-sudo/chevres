import { describe, expect, it } from 'vitest';
import { contientTexte, sansAccents } from '@/shared/utils/recherche';

describe('la recherche dans une liste', () => {
  it('ne tient compte ni des accents ni des majuscules', () => {
    expect(sansAccents('  État ')).toBe('etat');
    expect(contientTexte('Laboratoire d’analyses', 'ANALYSE')).toBe(true);
    expect(contientTexte('État', 'etat')).toBe(true);
    expect(contientTexte('Garage / réparateur', 'reparat')).toBe(true);
  });

  it('une recherche vide garde tout, une recherche qui ne correspond à rien ne garde rien', () => {
    expect(contientTexte('Banque', '')).toBe(true);
    expect(contientTexte('Banque', '   ')).toBe(true);
    expect(contientTexte('Banque', 'garage')).toBe(false);
  });
});
