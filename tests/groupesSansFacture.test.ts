import { describe, expect, it } from 'vitest';
import { groupeAccepteSansFacture } from '@/features/comptabilite/utils/recettes';
import { GROUPE_RECETTE } from '@/shared/constants/comptabilite';

describe('recette sans facture', () => {
  it('accepte les ventes de production, les prestations et l’autre recette', () => {
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.FROMAGES)).toBe(true);
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.VIANDE)).toBe(true);
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.PRESTATIONS)).toBe(true);
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.AUTRE)).toBe(true);
  });

  it('refuse l’aide, les remboursements et les indemnités', () => {
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.AIDE)).toBe(false);
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.GROUPEMENT_SANITAIRE)).toBe(false);
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.REMBOURSEMENT_ANALYSES)).toBe(false);
    expect(groupeAccepteSansFacture(GROUPE_RECETTE.ASSURANCE_VEHICULE)).toBe(false);
  });
});
