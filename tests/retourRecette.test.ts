import { describe, expect, it } from 'vitest';
import { parentDeLaPage } from '@/features/accueil/navigation/parentDeLaPage';
import { ROUTES } from '@/shared/constants/routes';

describe('retour d’une recette', () => {
  it('une nouvelle recette ou une recette ouverte revient à la bibliothèque des recettes', () => {
    expect(parentDeLaPage('/production/recette')).toBe(ROUTES.PRODUCTION_RECETTES);
  });

  it('les recettes elles-mêmes reviennent à la racine de l’Atelier', () => {
    expect(parentDeLaPage(ROUTES.PRODUCTION_RECETTES)).toBe('/production');
  });
});
