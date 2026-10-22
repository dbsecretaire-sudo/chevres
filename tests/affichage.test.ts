import { describe, expect, it } from 'vitest';
import { AFFICHAGE, afficheBureau, afficheSobre, modeAffichage, modeDeLaCommande } from '@/shared/utils/affichage';

describe('affichage de la version Windows', () => {
  it('hors de la version Windows, aucun affichage particulier', () => {
    expect(modeAffichage).toBe(AFFICHAGE.BUREAU);
    expect(afficheBureau()).toBe(false);
    expect(afficheSobre()).toBe(false);
  });

  it('une commande de menu « #affichage:… » donne son mode, une autre commande rien', () => {
    expect(modeDeLaCommande('#affichage:mobile')).toBe(AFFICHAGE.MOBILE);
    expect(modeDeLaCommande('#affichage:sobre')).toBe(AFFICHAGE.SOBRE);
    expect(modeDeLaCommande('#affichage:bureau')).toBe(AFFICHAGE.BUREAU);
    expect(modeDeLaCommande('#affichage:inconnu')).toBeUndefined();
    expect(modeDeLaCommande('/production/fromages')).toBeUndefined();
  });
});
