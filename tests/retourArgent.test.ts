import { describe, expect, it } from 'vitest';
import { parentDeLaPage } from '@/shared/navigation/parentDeLaPage';
import { pageParente } from '@/bureau/retour';

describe('retour des écrans du menu Argent', () => {
  it('sur le téléphone, chaque écran d’Argent revient à Argent', () => {
    for (const adresse of ['/comptabilite/liste', '/commercial/ventes', '/commercial/commandes', '/commercial/circuits', '/comptabilite/tresorerie', '/comptabilite/fiscalite', '/comptabilite/plan-comptable', '/production/flotte']) {
      expect(parentDeLaPage(adresse)).toBe('/rubrique/argent');
    }
    expect(parentDeLaPage('/production/lieu', 'assurance')).toBe('/rubrique/argent');
  });

  it('sur le téléphone, les sous-pages reviennent à leur écran parent', () => {
    expect(parentDeLaPage('/comptabilite/fiscalite-rsa-trimestrielle')).toBe('/comptabilite/fiscalite');
    expect(parentDeLaPage('/comptabilite/tresorerie-reglages')).toBe('/comptabilite/tresorerie');
    expect(parentDeLaPage('/comptabilite/nouvelle')).toBe('/comptabilite/liste');
  });

  it('sur Windows, les mêmes écrans reviennent à Argent', () => {
    expect(pageParente('/comptabilite/liste')).toBe('/rubrique/argent');
    expect(pageParente('/commercial/ventes')).toBe('/rubrique/argent');
    expect(pageParente('/production/lieu?lieu=assurance')).toBe('/rubrique/argent');
    expect(pageParente('/comptabilite/fiscalite-rsa-annuelle')).toBe('/comptabilite/fiscalite');
  });
});
