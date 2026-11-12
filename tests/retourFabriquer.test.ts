import { describe, expect, it } from 'vitest';
import { parentDeLaPage } from '@/features/accueil/navigation/parentDeLaPage';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';

describe('retour de la fabrication d’un produit', () => {
  it('la flèche de « Quel fromage ? » revient à la page « Fabriquer », pas à l’Atelier', () => {
    expect(parentDeLaPage('/production/fabrication-simple')).toBe(ROUTES.terrain('fabriquer'));
    expect(ROUTES.productionFabricationSimple(PRODUIT_A_LOTS.FROMAGE).split('?')[0]).toBe('/production/fabrication-simple');
  });
});
