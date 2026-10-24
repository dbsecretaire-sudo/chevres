import { describe, expect, it } from 'vitest';
import { groupeRecetteAutorise } from '@/features/clients/services/categorie';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { GROUPE_RECETTE } from '@/shared/constants/comptabilite';

describe('la recette touristique des contacts', () => {
  it('un particulier et les visiteurs la reçoivent d’office, pas une entreprise', () => {
    expect(groupeRecetteAutorise({ categorie: CATEGORIE_CLIENT.PARTICULIER }, GROUPE_RECETTE.TOURISTIQUE)).toBe(true);
    expect(groupeRecetteAutorise({ categorie: CATEGORIE_CLIENT.VISITEUR }, GROUPE_RECETTE.TOURISTIQUE)).toBe(true);
    expect(groupeRecetteAutorise({ categorie: CATEGORIE_CLIENT.GROUPE_VISITEURS }, GROUPE_RECETTE.TOURISTIQUE)).toBe(true);
    expect(groupeRecetteAutorise({ categorie: CATEGORIE_CLIENT.ENTREPRISE }, GROUPE_RECETTE.TOURISTIQUE)).toBe(false);
  });
});
