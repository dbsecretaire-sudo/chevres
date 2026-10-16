import { describe, expect, it } from 'vitest';
import { prixDuTarif } from '@/features/commercial/services/commandes';

describe('prix selon la catégorie de contact', () => {
  const tarifs = { 'viande:cabris': { particulier: 12, professionnel: 9 } };

  it('le prix de la catégorie du contact, sinon le prix de l’inventaire', () => {
    expect(prixDuTarif('viande:cabris', 'particulier', tarifs, { 'viande:cabris': 10 })).toBe(12);
    expect(prixDuTarif('viande:cabris', 'professionnel', tarifs, { 'viande:cabris': 10 })).toBe(9);
    // Une catégorie sans tarif, ou aucun contact : le prix de l'inventaire.
    expect(prixDuTarif('viande:cabris', 'organisme', tarifs, { 'viande:cabris': 10 })).toBe(10);
    expect(prixDuTarif('viande:cabris', undefined, tarifs, { 'viande:cabris': 10 })).toBe(10);
    expect(prixDuTarif('viande:cabris', 'organisme', tarifs, {})).toBeUndefined();
  });
});
